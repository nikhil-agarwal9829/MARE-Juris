import uuid
import logging
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth.deps import get_current_user
from app.services.rag_service import rag_service
from app.services.web_research_service import web_research_service
from app.services.legal_query_analysis import legal_query_analysis_service
from app.services.conversation_state import (
    get_pending_follow_up,
    build_pending_state,
    build_resolved_state,
)
from app.db.supabase import get_supabase_admin_client

logger = logging.getLogger("mare_juris.chat_router")

router = APIRouter(prefix="/chat", tags=["AI Legal Assistant & Chat"])


class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    query: str
    resolved_query: Optional[str] = None
    conversation_id: str
    message_id: str
    role: str
    follow_up: Dict[str, Any]
    conversation_state: Optional[Dict[str, Any]] = None
    rag: Optional[Dict[str, Any]] = None
    web: Optional[Dict[str, Any]] = None
    comparison: Dict[str, Any]


def _load_conversation_messages(user_id: str, conversation_id: Optional[str]) -> List[Dict[str, Any]]:
    if not conversation_id:
        return []
    try:
        admin = get_supabase_admin_client()
        res = (
            admin.table("messages")
            .select("id, role, content, metadata, created_at")
            .eq("conversation_id", conversation_id)
            .eq("user_id", user_id)
            .order("created_at")
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.warning(f"[CHAT_ROUTER] Message load failed: {e}")
        return []


def _history_for_analysis(messages: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    return [{"role": m["role"], "content": m["content"]} for m in messages]


@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    payload: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    if not payload.message.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message content cannot be empty.")

    user_id = current_user["id"]
    user_message = payload.message.strip()

    try:
        prior_messages = _load_conversation_messages(user_id, payload.conversation_id)
        pending = get_pending_follow_up(prior_messages + [{"role": "user", "content": user_message}])

        resolved_query: Optional[str] = None
        conversation_state: Optional[Dict[str, Any]] = None
        history = _history_for_analysis(prior_messages)

        if pending:
            resolution = legal_query_analysis_service.resolve_follow_up(
                pending["originalQuery"],
                pending.get("followUpQuestion") or "",
                user_message,
            )
            if resolution.get("topic_switched"):
                resolved_query = None
                conversation_state = None
                logger.info("[CHAT_ROUTER] Topic switch detected; treating as new query.")
            else:
                resolved_query = resolution["resolved_query"]
                conversation_state = build_resolved_state(
                    pending["originalQuery"],
                    pending.get("followUpQuestion") or "",
                    user_message,
                    resolved_query,
                )
                logger.info(f"[CHAT_ROUTER] Resolved follow-up query: {resolved_query}")

        try:
            rag_result = rag_service.process_query(
                user_id=user_id,
                query_text=user_message,
                conversation_id=payload.conversation_id,
                persist=False,
                history=history,
                skip_followup=bool(resolved_query),
                resolved_query=resolved_query,
                bypass_classifier=bool(resolved_query),
                conversation_state=conversation_state,
            )
        except Exception as rag_err:
            logger.error(f"[CHAT_ROUTER] RAG pipeline failed: {rag_err}")
            rag_result = {
                "status": "error",
                "answer": "Controlled-corpus retrieval is currently unavailable.",
                "citations": [],
                "evidence": [],
                "sources": [],
                "verification": {"verified": False, "issues": [str(rag_err)]},
                "follow_up": {"required": False, "question": None, "reason": None},
                "is_filtered": False,
                "effective_query": resolved_query or user_message,
                "resolved_query": resolved_query,
                "conversation_state": conversation_state,
            }

        is_filtered = rag_result.get("is_filtered", False)
        follow_up = rag_result.get("follow_up") or {
            "required": rag_result.get("status") == "follow_up",
            "question": None,
            "reason": None,
        }
        needs_clarification = follow_up.get("required") or rag_result.get("status") == "follow_up"

        if is_filtered:
            web_result = {
                "status": "unverified",
                "answer": "Web research skipped because the query is not legally relevant or is filtered.",
                "citations": [],
                "evidence": [],
                "sources": [],
                "verification": {"verified": False, "issues": ["Query is filtered"]},
            }
        elif needs_clarification:
            web_result = None
        else:
            effective = rag_result.get("effective_query") or resolved_query or user_message
            try:
                web_result = await web_research_service.process_query(effective)
            except Exception as web_err:
                logger.error(f"[CHAT_ROUTER] Web pipeline failed: {web_err}")
                web_result = {
                    "status": "error",
                    "answer": "LIVE OFFICIAL WEB RESEARCH is currently unavailable.",
                    "citations": [],
                    "evidence": [],
                    "sources": [],
                    "verification": {"verified": False, "issues": [str(web_err)]},
                }

        conversation_id = rag_result.get("conversation_id", payload.conversation_id) or str(uuid.uuid4())
        message_id = str(uuid.uuid4())

        admin_supabase = get_supabase_admin_client()
        conv_check = admin_supabase.table("conversations").select("id").eq("id", conversation_id).eq("user_id", user_id).execute()
        if not conv_check.data:
            title = user_message[:40] + "..." if len(user_message) > 40 else user_message
            admin_supabase.table("conversations").insert({
                "id": conversation_id,
                "user_id": user_id,
                "title": title,
            }).execute()

        user_msg_id = str(uuid.uuid4())
        admin_supabase.table("messages").insert({
            "id": user_msg_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "user",
            "content": user_message,
        }).execute()

        assistant_content = "Dual-Answer Response"
        meta_state = rag_result.get("conversation_state")
        if needs_clarification:
            assistant_content = rag_result.get("answer") or follow_up.get("question") or "Clarification needed."
            meta_state = build_pending_state(
                user_message if not pending else pending.get("originalQuery", user_message),
                follow_up.get("question") or "",
                follow_up.get("reason"),
            )
            if pending:
                meta_state["originalQuery"] = pending.get("originalQuery", user_message)

        admin_supabase.table("messages").insert({
            "id": message_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "assistant",
            "content": assistant_content,
            "metadata": {
                "follow_up": follow_up,
                "conversation_state": meta_state,
                "rag": None if needs_clarification else rag_result,
                "web": web_result,
                "is_filtered": is_filtered,
                "query_analysis": rag_result.get("query_analysis"),
                "resolved_query": rag_result.get("resolved_query") or resolved_query,
            },
        }).execute()

        effective_out = rag_result.get("effective_query") or resolved_query

        return {
            "query": user_message,
            "resolved_query": effective_out,
            "conversation_id": conversation_id,
            "message_id": message_id,
            "role": "assistant",
            "follow_up": follow_up,
            "conversation_state": meta_state,
            "rag": None if needs_clarification else rag_result,
            "web": web_result,
            "comparison": {
                "available": False,
                "agreements": [],
                "differences": [],
                "freshness_flags": [],
                "conflicts": [],
            },
        }
    except Exception as e:
        logger.error(f"[CHAT_ROUTER] Error executing dual pipelines: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing legal RAG engine: {str(e)}",
        )


class CompareRequest(BaseModel):
    query: str
    rag_content: str
    web_content: str


@router.post("/compare")
async def compare_sources(payload: CompareRequest, current_user: dict = Depends(get_current_user)):
    try:
        return await web_research_service.compare_sources(
            rag_content=payload.rag_content,
            web_content=payload.web_content,
            query=payload.query,
        )
    except Exception as e:
        logger.error(f"[CHAT_ROUTER] Error comparing sources: {e}")
        raise HTTPException(status_code=500, detail="Error comparing sources")


@router.get("/conversations")
def get_user_conversations(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    admin_supabase = get_supabase_admin_client()
    try:
        res = admin_supabase.table("conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
        return {"conversations": res.data}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error retrieving conversation threads: {str(e)}")


@router.get("/conversations/{conversation_id}")
def get_conversation_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    admin_supabase = get_supabase_admin_client()
    try:
        conv = admin_supabase.table("conversations").select("*").eq("id", conversation_id).eq("user_id", user_id).execute()
        if not conv.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation thread not found or unauthorized access.")
        messages = admin_supabase.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at").execute()
        return {"conversation": conv.data[0], "messages": messages.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching message transcript: {str(e)}")


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    admin_supabase = get_supabase_admin_client()
    try:
        admin_supabase.table("conversations").delete().eq("id", conversation_id).eq("user_id", user_id).execute()
        return {"status": "success", "message": "Conversation thread deleted."}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error deleting conversation: {str(e)}")
