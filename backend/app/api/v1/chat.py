from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth.deps import get_current_user
from app.services.rag_service import rag_service
from app.db.supabase import get_supabase_admin_client

router = APIRouter(prefix="/chat", tags=["AI Legal Assistant & Chat"])


class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    conversation_id: str
    message_id: str
    role: str
    content: str
    citations: List[Dict[str, Any]]


@router.post("/message", response_model=ChatMessageResponse)
def send_chat_message(
    payload: ChatMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Processes a legal query through the MARE-Juris Evidence-Grounded RAG Engine.
    Requires user JWT authentication.
    """
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    user_id = current_user["id"]
    try:
        result = rag_service.process_query(
            user_id=user_id,
            query_text=payload.message.strip(),
            conversation_id=payload.conversation_id
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing legal RAG engine: {str(e)}"
        )


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
