import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("mare_juris.conversation_state")


def get_pending_follow_up(messages: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Pending follow-up exists when the latest user message is answering
    the immediately preceding assistant clarification request.
    """
    if len(messages) < 2:
        return None
    last = messages[-1]
    prev = messages[-2]
    if last.get("role") != "user" or prev.get("role") != "assistant":
        return None

    meta = prev.get("metadata") or {}
    state = meta.get("conversation_state") or {}
    follow_up = meta.get("follow_up") or {}
    if not (state.get("pendingFollowUp") or follow_up.get("required")):
        return None

    original = state.get("originalQuery") or _infer_original_query(messages, prev)
    return {
        "pendingFollowUp": True,
        "originalQuery": original,
        "followUpQuestion": state.get("followUpQuestion") or follow_up.get("question"),
        "followUpReason": state.get("followUpReason") or follow_up.get("reason"),
    }


def _infer_original_query(messages: List[Dict[str, Any]], assistant_msg: Dict[str, Any]) -> str:
    idx = None
    for i, msg in enumerate(messages):
        if msg.get("id") == assistant_msg.get("id"):
            idx = i
            break
    if idx is not None and idx > 0:
        for j in range(idx - 1, -1, -1):
            if messages[j].get("role") == "user":
                return (messages[j].get("content") or "").strip()
    for msg in reversed(messages):
        if msg.get("role") == "user":
            return (msg.get("content") or "").strip()
    return ""


def build_pending_state(original_query: str, follow_up_question: str, follow_up_reason: Optional[str]) -> Dict[str, Any]:
    return {
        "pendingFollowUp": True,
        "originalQuery": original_query,
        "followUpQuestion": follow_up_question,
        "followUpReason": follow_up_reason,
        "followUpAnswer": None,
        "resolvedQuery": None,
    }


def build_resolved_state(
    original_query: str,
    follow_up_question: str,
    follow_up_answer: str,
    resolved_query: str,
) -> Dict[str, Any]:
    return {
        "pendingFollowUp": False,
        "originalQuery": original_query,
        "followUpQuestion": follow_up_question,
        "followUpAnswer": follow_up_answer,
        "resolvedQuery": resolved_query,
    }
