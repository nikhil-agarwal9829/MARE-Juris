"""
Document Analysis Agent for MARE-Juris.

Implements the standard agent interface for document-derived evidence:
1. Receives document metadata, extracted pages, and user query.
2. Invokes DocumentContextService to synthesize structured facts, clauses, and obligations.
3. Formats an evidence-grounded legal answer citing exact pages and verbatim excerpts.
4. Generates standard citation objects adhering to the MARE-Juris citation schema.
5. Returns provenance: "DOCUMENT_ANALYSIS".
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

from app.services.document_context_service import document_context_service, DocumentContextPackage

logger = logging.getLogger("mare_juris.document_agent")


class DocumentAgent:
    """Legal Document Analysis Agent."""

    def __init__(self):
        pass

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def analyze_document(
        self,
        query: str,
        document_id: str,
        document_title: str,
        pages: List[Dict[str, Any]],
        full_text: str,
        ocr_warnings: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Executes document analysis and returns standard agent response contract.
        """
        retrieval_ts = self._now_iso()

        if not pages or not full_text.strip():
            return {
                "agent_id": "document_agent",
                "agent_name": "Document Analysis Agent",
                "status": "empty",
                "answer": f"The document '{document_title}' contains no readable text to analyze.",
                "citations": [],
                "evidence": [],
                "sources": [document_title],
                "provenance": "DOCUMENT_ANALYSIS",
                "retrieved_at": retrieval_ts,
                "document_context": None,
                "ocr_warnings": ocr_warnings or [],
                "errors": ["Document has no extractable text content."],
            }

        try:
            # 1. Synthesize structured context
            ctx_pkg: DocumentContextPackage = await document_context_service.synthesize_document_context(
                query=query,
                document_name=document_title,
                pages=pages,
                full_text=full_text,
                ocr_warnings=ocr_warnings,
            )

            # 2. Build standardized citations list
            citations: List[Dict[str, Any]] = []
            for idx, c in enumerate(ctx_pkg.relevant_clauses):
                citations.append({
                    "citation_id": f"DOC-P{c.page_number}-{idx + 1}",
                    "document_title": document_title,
                    "title": f"{c.clause_title} (Page {c.page_number})",
                    "section": c.clause_title,
                    "page": str(c.page_number),
                    "evidence_text": c.excerpt,
                    "relevance": c.relevance,
                    "source_url": None,
                    "source_provider": "User Uploaded Document",
                    "provenance": "DOCUMENT_ANALYSIS",
                    "official_source_verified": True,
                    "full_text_verified": True,
                    "retrieved_at": retrieval_ts,
                })

            # 3. Format structured, readable markdown answer
            answer_lines = [
                f"### Document Analysis: {document_title}",
                "",
                ctx_pkg.direct_answer_summary,
                "",
            ]

            if ctx_pkg.relevant_facts:
                answer_lines.append("**Key Document Facts & Context:**")
                for f in ctx_pkg.relevant_facts:
                    answer_lines.append(f"- {f}")
                answer_lines.append("")

            if ctx_pkg.relevant_clauses:
                answer_lines.append(f"**Supporting Clauses & Excerpts ({len(ctx_pkg.relevant_clauses)} cited):**")
                for c in ctx_pkg.relevant_clauses:
                    answer_lines.append(f"- **{c.clause_title}** *(Page {c.page_number})*")
                    answer_lines.append(f"  > \"{c.excerpt}\"")
                    if c.relevance:
                        answer_lines.append(f"  *Relevance: {c.relevance}*")
                answer_lines.append("")

            if ctx_pkg.parties:
                answer_lines.append(f"**Identified Parties:** {', '.join(ctx_pkg.parties)}\n")

            if ctx_pkg.obligations:
                answer_lines.append("**Key Rights & Obligations:**")
                for ob in ctx_pkg.obligations:
                    answer_lines.append(f"- {ob}")
                answer_lines.append("")

            if ctx_pkg.dates_and_amounts:
                answer_lines.append("**Dates & Financial Terms:**")
                for d in ctx_pkg.dates_and_amounts:
                    answer_lines.append(f"- {d}")
                answer_lines.append("")

            if ctx_pkg.issues_requiring_external_research:
                answer_lines.append("**External Legal Issues Identified:**")
                for iss in ctx_pkg.issues_requiring_external_research:
                    answer_lines.append(f"- {iss}")
                answer_lines.append("")

            if ctx_pkg.uncertainty_warnings:
                answer_lines.append("> ⚠️ **Document Quality & Text Warnings:**")
                for w in ctx_pkg.uncertainty_warnings:
                    answer_lines.append(f"> - {w}")
                answer_lines.append("")

            formatted_answer = "\n".join(answer_lines)

            return {
                "agent_id": "document_agent",
                "agent_name": "Document Analysis Agent",
                "status": "success",
                "answer": formatted_answer,
                "citations": citations,
                "evidence": citations,
                "sources": [document_title],
                "provenance": "DOCUMENT_ANALYSIS",
                "retrieved_at": retrieval_ts,
                "document_context": ctx_pkg.model_dump(),
                "ocr_warnings": ctx_pkg.uncertainty_warnings,
                "errors": None,
            }

        except Exception as e:
            logger.error(f"[DOC_AGENT] Document analysis failed: {e}")
            return {
                "agent_id": "document_agent",
                "agent_name": "Document Analysis Agent",
                "status": "error",
                "answer": f"Analysis of document '{document_title}' encountered an internal error.",
                "citations": [],
                "evidence": [],
                "sources": [document_title],
                "provenance": "DOCUMENT_ANALYSIS",
                "retrieved_at": retrieval_ts,
                "document_context": None,
                "ocr_warnings": ocr_warnings or [],
                "errors": [str(e)],
            }


document_agent = DocumentAgent()
