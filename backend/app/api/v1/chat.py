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
    selected_agents: Optional[List[str]] = None
    generate_combined: Optional[bool] = True
    compare_sources: Optional[bool] = True
    verify_sources: Optional[bool] = False
    document_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    query: str
    resolved_query: Optional[str] = None
    conversation_id: str
    message_id: str
    role: str
    follow_up: Dict[str, Any]
    conversation_state: Optional[Dict[str, Any]] = None
    # Backward compatibility
    rag: Optional[Dict[str, Any]] = None
    web: Optional[Dict[str, Any]] = None
    comparison: Optional[Dict[str, Any]] = None
    # Multi-Agent additions
    selected_agents: Optional[List[str]] = None
    individual_responses: Optional[Dict[str, Any]] = None
    combined_answer: Optional[Dict[str, Any]] = None
    verification: Optional[Dict[str, Any]] = None


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

        # Multi-Agent Workflow Handling
        # If payload.selected_agents is explicitly passed:
        if payload.selected_agents is not None:
            if not payload.selected_agents:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Please select at least one agent to proceed with consultation.",
                )
            selected_agents = payload.selected_agents
        else:
            # Default backward-compatible agents: statutory_rag + official_web
            selected_agents = ["statutory_rag", "official_web"]

        # Validate agent IDs
        from app.services.multi_agent_orchestrator import multi_agent_orchestrator, VALID_AGENT_IDS
        invalid_agents = multi_agent_orchestrator.find_invalid_agent_ids(selected_agents)
        if invalid_agents:
            supported = ", ".join(sorted(VALID_AGENT_IDS))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown agent ID(s): {', '.join(invalid_agents)}. Supported agents: {supported}.",
            )

        validated_agents = multi_agent_orchestrator.validate_agent_ids(selected_agents)
        if not validated_agents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please select at least one agent to proceed with consultation.",
            )

        # Run multi-agent orchestrator
        orch_res = await multi_agent_orchestrator.execute_orchestration(
            query=user_message,
            user_id=user_id,
            selected_agents=validated_agents,
            conversation_id=payload.conversation_id,
            history=history,
            resolved_query=resolved_query,
            conversation_state=conversation_state,
            generate_combined=bool(payload.generate_combined),
            compare_sources=bool(payload.compare_sources),
            verify_sources=bool(payload.verify_sources),
            document_id=payload.document_id,
        )

        indiv_responses = orch_res.get("individual_responses", {})
        rag_result = indiv_responses.get("statutory_rag")
        web_result = indiv_responses.get("official_web")
        combined_answer = orch_res.get("combined_answer")
        comparison_res = orch_res.get("comparison") or {
            "available": False,
            "agreements": [],
            "differences": [],
            "freshness_flags": [],
            "conflicts": [],
        }
        verification_res = orch_res.get("verification")

        conversation_id = payload.conversation_id or str(uuid.uuid4())
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

        assistant_content = combined_answer.get("answer") if (combined_answer and combined_answer.get("answer")) else "Multi-Agent Consultation Response"
        follow_up = rag_result.get("follow_up") if rag_result else {"required": False, "question": None, "reason": None}
        if not follow_up:
            follow_up = {"required": False, "question": None, "reason": None}

        admin_supabase.table("messages").insert({
            "id": message_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "assistant",
            "content": assistant_content,
            "metadata": {
                "follow_up": follow_up,
                "conversation_state": conversation_state,
                "selected_agents": validated_agents,
                "individual_responses": indiv_responses,
                "combined_answer": combined_answer,
                "comparison": comparison_res,
                "verification": verification_res,
                "rag": rag_result,
                "web": web_result,
            },
        }).execute()

        return {
            "query": user_message,
            "resolved_query": resolved_query,
            "conversation_id": conversation_id,
            "message_id": message_id,
            "role": "assistant",
            "follow_up": follow_up,
            "conversation_state": conversation_state,
            "rag": rag_result,
            "web": web_result,
            "comparison": comparison_res,
            "selected_agents": validated_agents,
            "individual_responses": indiv_responses,
            "combined_answer": combined_answer,
            "verification": verification_res,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[CHAT_ROUTER] Error executing multi-agent pipelines: {str(e)}")
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
