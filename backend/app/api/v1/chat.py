import asyncio
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth.deps import get_current_user
from app.services.rag_service import rag_service
from app.services.web_research_service import web_research_service
from app.db.supabase import get_supabase_admin_client
import uuid
import logging

logger = logging.getLogger("mare_juris.chat_router")

router = APIRouter(prefix="/chat", tags=["AI Legal Assistant & Chat"])


class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    query: str
    conversation_id: str
    message_id: str
    role: str
    rag: Dict[str, Any]
    web: Dict[str, Any]
    comparison: Dict[str, Any]


@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    payload: ChatMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Processes a legal query through the Dual-Source Architecture:
    1. MARE-Juris Evidence-Grounded RAG Engine
    2. Live Official Web Research Pipeline
    """
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    user_id = current_user["id"]
    try:
        # 1. RAG PIPELINE
        rag_result = rag_service.process_query(
            user_id=user_id,
            query_text=payload.message.strip(),
            conversation_id=payload.conversation_id,
            persist=False # We will persist manually here
        )
        
        # 2. WEB RESEARCH PIPELINE
        is_filtered = rag_result.get("is_filtered", False)
        
        if is_filtered:
            web_result = {
                "status": "unverified",
                "answer": "Web research skipped because the query is not legally relevant or is filtered.",
                "citations": [],
                "evidence": [],
                "sources": [],
                "verification": {"verified": False, "issues": ["Query is filtered"]}
            }
        else:
            web_result = await web_research_service.process_query(payload.message.strip())

        conversation_id = rag_result.get("conversation_id", payload.conversation_id)
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
        message_id = str(uuid.uuid4())

        # Persist dual response
        admin_supabase = get_supabase_admin_client()

        # Ensure conversation thread exists with user_id isolation
        conv_check = admin_supabase.table("conversations").select("id").eq("id", conversation_id).eq("user_id", user_id).execute()
        if not conv_check.data:
            title = payload.message.strip()[:40] + "..." if len(payload.message.strip()) > 40 else payload.message.strip()
            admin_supabase.table("conversations").insert({
                "id": conversation_id,
                "user_id": user_id,
                "title": title
            }).execute()

        # Persist User Message
        user_msg_id = str(uuid.uuid4())
        admin_supabase.table("messages").insert({
            "id": user_msg_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "user",
            "content": payload.message.strip()
        }).execute()

        # Persist Assistant Message (Dual Payload)
        admin_supabase.table("messages").insert({
            "id": message_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "assistant",
            "content": "Dual-Answer Response",
            "metadata": {
                "rag": rag_result,
                "web": web_result,
                "is_filtered": is_filtered
            }
        }).execute()

        return {
            "query": payload.message.strip(),
            "conversation_id": conversation_id,
            "message_id": message_id,
            "role": "assistant",
            "rag": rag_result,
            "web": web_result,
            "comparison": {
                "available": False,
                "agreements": [],
                "differences": [],
                "freshness_flags": [],
                "conflicts": []
            }
        }
    except Exception as e:
        logger.error(f"[CHAT_ROUTER] Error executing dual pipelines: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing legal RAG engine: {str(e)}"
        )

class CompareRequest(BaseModel):
    query: str
    rag_content: str
    web_content: str

@router.post("/compare")
async def compare_sources(
    payload: CompareRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Compares RAG corpus output against live official web sources.
    """
    try:
        comparison = await web_research_service.compare_sources(
            rag_content=payload.rag_content,
            web_content=payload.web_content,
            query=payload.query
        )
        return comparison
    except Exception as e:
        logger.error(f"[CHAT_ROUTER] Error comparing sources: {e}")
        raise HTTPException(status_code=500, detail="Error comparing sources")


@router.get("/conversations")
def get_user_conversations(current_user: dict = Depends(get_current_user)):
    """
    Retrieves all conversation threads initiated by the authenticated user.
    """
    user_id = current_user["id"]
    admin_supabase = get_supabase_admin_client()

    try:
        res = admin_supabase.table("conversations")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("updated_at", desc=True)\
            .execute()
        return {"conversations": res.data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving conversation threads: {str(e)}"
        )


@router.get("/conversations/{conversation_id}")
def get_conversation_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieves message history transcript for a specific conversation.
    """
    user_id = current_user["id"]
    admin_supabase = get_supabase_admin_client()

    try:
        # Check ownership
        conv = admin_supabase.table("conversations")\
            .select("*")\
            .eq("id", conversation_id)\
            .eq("user_id", user_id)\
            .execute()

        if not conv.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation thread not found or unauthorized access."
            )

        messages = admin_supabase.table("messages")\
            .select("*")\
            .eq("conversation_id", conversation_id)\
            .order("created_at")\
            .execute()

        return {
            "conversation": conv.data[0],
            "messages": messages.data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching message transcript: {str(e)}"
        )


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Deletes a conversation thread and associated messages.
    """
    user_id = current_user["id"]
    admin_supabase = get_supabase_admin_client()

    try:
        admin_supabase.table("conversations")\
            .delete()\
            .eq("id", conversation_id)\
            .eq("user_id", user_id)\
            .execute()
        return {"status": "success", "message": "Conversation thread deleted."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting conversation: {str(e)}"
        )
