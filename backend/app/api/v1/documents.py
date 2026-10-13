"""
Document Upload and Management API for MARE-Juris.

Handles:
1. POST /api/v1/documents/upload: Multipart file upload, extraction, and chunk storage.
2. GET /api/v1/documents/{document_id}: Retrieve document metadata and page summaries.
3. DELETE /api/v1/documents/{document_id}: Delete document and associated chunks.
4. get_document_data(document_id, user_id): Internal helper for orchestrator.
"""

import os
import uuid
import logging
from typing import Dict, List, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel

from app.auth.deps import get_current_user
from app.db.supabase import get_supabase_admin_client
from app.services.document_extraction_service import (
    document_extraction_service,
    DocumentExtractionResult,
)

logger = logging.getLogger("mare_juris.documents_api")

router = APIRouter(prefix="/documents", tags=["Document Agent & Management"])

# In-memory document session cache for instant retrieval & test execution
_IN_MEMORY_DOCS_STORE: Dict[str, Dict[str, Any]] = {}


class DocumentUploadResponse(BaseModel):
    document_id: str
    file_name: str
    file_size: int
    file_type: str
    total_pages: int
    has_ocr_pages: bool
    ocr_pages_count: int
    warnings: List[str]
    status: str
    created_at: str


class DocumentDetailResponse(BaseModel):
    document_id: str
    file_name: str
    file_size: int
    file_type: str
    total_pages: int
    has_ocr_pages: bool
    ocr_pages_count: int
    warnings: List[str]
    status: str
    pages: List[Dict[str, Any]]


def get_document_data(document_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves document pages and metadata for a user.
    Checks in-memory store first, then queries Supabase.
    """
    doc_entry = _IN_MEMORY_DOCS_STORE.get(document_id)
    if doc_entry and doc_entry.get("user_id") == user_id:
        return doc_entry

    try:
        admin_supabase = get_supabase_admin_client()
        doc_res = (
            admin_supabase.table("uploaded_documents")
            .select("*")
            .eq("id", document_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not doc_res.data:
            return None

        doc_row = doc_res.data[0]
        chunks_res = (
            admin_supabase.table("document_chunks")
            .select("*")
            .eq("uploaded_document_id", document_id)
            .eq("user_id", user_id)
            .order("chunk_index")
            .execute()
        )

        pages = []
        for c in (chunks_res.data or []):
            pages.append({
                "page_number": c.get("chunk_index", 1),
                "text": c.get("content", ""),
                "char_count": len(c.get("content", "")),
                "is_ocr": (c.get("metadata") or {}).get("is_ocr", False),
                "ocr_confidence": (c.get("metadata") or {}).get("ocr_confidence"),
                "warnings": (c.get("metadata") or {}).get("warnings", []),
            })

        full_text = "\n\n".join(
            f"--- PAGE {p['page_number']} ---\n{p['text']}" for p in pages if p['text']
        )

        data = {
            "document_id": document_id,
            "user_id": user_id,
            "file_name": doc_row.get("file_name", "document"),
            "file_size": doc_row.get("file_size", 0),
            "file_type": doc_row.get("mime_type", "pdf"),
            "total_pages": len(pages),
            "pages": pages,
            "full_text": full_text,
            "has_ocr_pages": (doc_row.get("metadata") or {}).get("has_ocr_pages", False),
            "ocr_pages_count": (doc_row.get("metadata") or {}).get("ocr_pages_count", 0),
            "warnings": (doc_row.get("metadata") or {}).get("warnings", []),
            "status": doc_row.get("status", "ready"),
        }
        # Cache for subsequent turns in session
        _IN_MEMORY_DOCS_STORE[document_id] = data
        return data

    except Exception as e:
        logger.warning(f"[DOC_LOOKUP] Failed to query Supabase for document {document_id}: {e}")
        return None


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Uploads a document (PDF, DOCX, JPG, PNG), extracts its text/pages,
    and stores chunks securely for the authenticated user.
    """
    user_id = current_user["id"]

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    # 1. Extract content and validate
    extraction: DocumentExtractionResult = document_extraction_service.extract_document(
        file_bytes=file_bytes,
        file_name=file.filename or "uploaded_file",
        content_type=file.content_type,
    )

    if not extraction.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=extraction.error or "Failed to extract text from document.",
        )

    document_id = str(uuid.uuid4())
    created_at = "now"

    # Convert pages to serializable dicts
    pages_dicts = [
        {
            "page_number": p.page_number,
            "text": p.text,
            "char_count": p.char_count,
            "is_ocr": p.is_ocr,
            "ocr_confidence": p.ocr_confidence,
            "warnings": p.warnings,
        }
        for p in extraction.pages
    ]

    doc_data = {
        "document_id": document_id,
        "user_id": user_id,
        "file_name": extraction.file_name,
        "file_size": extraction.file_size,
        "file_type": extraction.file_type,
        "total_pages": extraction.total_pages,
        "pages": pages_dicts,
        "full_text": extraction.full_text,
        "has_ocr_pages": extraction.has_ocr_pages,
        "ocr_pages_count": extraction.ocr_pages_count,
        "warnings": extraction.warnings,
        "status": "ready",
    }

    # Store in memory cache
    _IN_MEMORY_DOCS_STORE[document_id] = doc_data

    # 2. Persist to Supabase if available
    try:
        admin_supabase = get_supabase_admin_client()
        admin_supabase.table("uploaded_documents").insert({
            "id": document_id,
            "user_id": user_id,
            "file_name": extraction.file_name,
            "file_size": extraction.file_size,
            "mime_type": file.content_type or extraction.file_type,
            "storage_path": f"user_docs/{user_id}/{document_id}_{extraction.file_name}",
            "status": "ready",
            "metadata": {
                "total_pages": extraction.total_pages,
                "has_ocr_pages": extraction.has_ocr_pages,
                "ocr_pages_count": extraction.ocr_pages_count,
                "low_confidence_pages": extraction.low_confidence_pages,
                "warnings": extraction.warnings,
            },
        }).execute()

        # Batch insert chunks
        chunk_rows = []
        for p in extraction.pages:
            chunk_rows.append({
                "uploaded_document_id": document_id,
                "user_id": user_id,
                "chunk_index": p.page_number,
                "content": p.text,
                "metadata": {
                    "is_ocr": p.is_ocr,
                    "ocr_confidence": p.ocr_confidence,
                    "warnings": p.warnings,
                },
            })

        if chunk_rows:
            admin_supabase.table("document_chunks").insert(chunk_rows).execute()

    except Exception as db_err:
        logger.warning(
            f"[DOC_UPLOAD_DB] Supabase storage write warning ({db_err}). Document kept in active session store."
        )

    return DocumentUploadResponse(
        document_id=document_id,
        file_name=extraction.file_name,
        file_size=extraction.file_size,
        file_type=extraction.file_type,
        total_pages=extraction.total_pages,
        has_ocr_pages=extraction.has_ocr_pages,
        ocr_pages_count=extraction.ocr_pages_count,
        warnings=extraction.warnings,
        status="ready",
        created_at=created_at,
    )


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieves document metadata and page text for the authenticated user.
    """
    user_id = current_user["id"]
    doc = get_document_data(document_id, user_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or unauthorized access.",
        )

    return DocumentDetailResponse(
        document_id=doc["document_id"],
        file_name=doc["file_name"],
        file_size=doc["file_size"],
        file_type=doc["file_type"],
        total_pages=doc["total_pages"],
        has_ocr_pages=doc["has_ocr_pages"],
        ocr_pages_count=doc["ocr_pages_count"],
        warnings=doc["warnings"],
        status=doc["status"],
        pages=doc["pages"],
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Deletes an uploaded document and its chunks.
    """
    user_id = current_user["id"]

    # Remove from memory store
    if document_id in _IN_MEMORY_DOCS_STORE:
        if _IN_MEMORY_DOCS_STORE[document_id].get("user_id") == user_id:
            del _IN_MEMORY_DOCS_STORE[document_id]

    # Delete from Supabase
    try:
        admin_supabase = get_supabase_admin_client()
        admin_supabase.table("uploaded_documents").delete().eq("id", document_id).eq("user_id", user_id).execute()
    except Exception as e:
        logger.warning(f"[DOC_DELETE] Supabase delete warning: {e}")

    return {"status": "success", "message": f"Document {document_id} deleted."}
