import json
import logging
from typing import Any, Dict, List, Optional

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger("mare_juris.query_analysis")

MODELS = ("gemini-3.5-flash-lite", "gemini-3.6-flash")


class LegalQueryAnalysisService:
    """LLM query understanding for Ask MARE-Juris (not Compliance Agent)."""

    def __init__(self) -> None:
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)

    def _call_llm_json(self, sys_prompt: str, user_prompt: str) -> Dict[str, Any]:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set.")
        last_err: Optional[Exception] = None
        for model_name in MODELS:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content([sys_prompt, user_prompt])
                raw = response.text.strip()
                if raw.startswith("```json"):
                    raw = raw.replace("```json", "").replace("```", "").strip()
                elif raw.startswith("```"):
                    raw = raw.replace("```", "").strip()
                return json.loads(raw)
            except Exception as e:
                last_err = e
                logger.warning(f"[QUERY_ANALYSIS] {model_name} failed: {e}")
        if last_err:
            raise last_err
        raise RuntimeError("Query analysis failed.")

    def resolve_follow_up(self, original_query: str, follow_up_question: str, follow_up_answer: str) -> Dict[str, Any]:
        """Merge clarification into a resolved legal research query."""
        answer = follow_up_answer.strip()
        original = original_query.strip()
        sys_prompt = """You merge a user's clarification into their original legal question.
Return ONLY JSON:
{
  "resolved_query": "single complete question",
  "topic_switched": false
}
Do not invent facts. If the answer is only a location, append it naturally to the original question."""
        user_prompt = (
            f"Original question: {original}\n"
            f"Clarification asked: {follow_up_question}\n"
            f"User answer: {answer}"
        )
        try:
            result = self._call_llm_json(sys_prompt, user_prompt)
            resolved = (result.get("resolved_query") or "").strip()
            if not resolved:
                raise ValueError("empty resolved_query")
            return {
                "resolved_query": resolved,
                "topic_switched": bool(result.get("topic_switched", False)),
                "original_query": original,
                "follow_up_question": follow_up_question,
                "follow_up_answer": answer,
            }
        except Exception as e:
            logger.warning(f"[QUERY_ANALYSIS] resolve_follow_up LLM failed: {e}")
            resolved = original.rstrip("?.!")
            if answer and len(answer.split()) <= 8:
                resolved = f"{resolved} in {answer}"
            else:
                resolved = f"{resolved}. Additional context: {answer}"
            return {
                "resolved_query": resolved,
                "topic_switched": False,
                "original_query": original,
                "follow_up_question": follow_up_question,
                "follow_up_answer": answer,
            }

    def _default_retrieval_concepts(self, query: str) -> List[str]:
        q = query.lower()
        concepts = [query.strip()]
        if any(k in q for k in ("tenant", "landlord", "rent", "lease", "evict")):
            concepts.extend(
                [
                    "rights of lessee",
                    "lessor obligations",
                    "lease termination notice",
                    "Transfer of Property Act lease",
                    "possession of leased property",
                ]
            )
        if "consumer" in q:
            concepts.append("Consumer Protection Act consumer rights")
        if "contract" in q:
            concepts.append("Indian Contract Act agreement breach")
        if "data" in q or "privacy" in q or "dpdp" in q:
            concepts.append("Digital Personal Data Protection Act personal data")
        return list(dict.fromkeys(concepts))[:8]

    def _heuristic_analysis(self, query: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
        q = query.lower().strip()
        effective = query.strip()
        if history:
            prior_user = [m["content"] for m in history if m.get("role") == "user"]
            if prior_user:
                effective = f"{prior_user[-1]} — additional detail: {query.strip()}"

        requires_followup = False
        followup_question = None
        followup_reason = None

        if any(k in q for k in ("evict", "landlord", "tenant", "rights as a tenant")) and not any(
            k in q
            for k in (
                "chennai", "mumbai", "delhi", "bengaluru", "hyderabad", "state", "tamil", "tamilnadu",
                "karnataka", "maharashtra", "union territory", "ut ",
            )
        ):
            requires_followup = True
            followup_question = (
                "To give you an accurate answer, I need one detail: which state is the property located in, "
                "and do you have a written rental agreement?"
            )
            followup_reason = "Tenancy and eviction rules can depend on state law and the type of agreement."

        if any(k in q for k in ("cancel", "terminate")) and "contract" in q and "type" not in q:
            requires_followup = True
            followup_question = (
                "What type of contract is it (employment, rental, service, purchase), and are you trying to end it before the agreed term?"
            )
            followup_reason = "Termination rights depend on contract type and terms."

        return {
            "intent": "legal_research",
            "topic": query[:120],
            "jurisdiction": "India",
            "entities": [],
            "facts_explicitly_provided": [],
            "requested_information": [query.strip()],
            "ambiguities": [],
            "missing_information": [],
            "requires_followup": requires_followup,
            "followup_question": followup_question,
            "followup_reason": followup_reason,
            "effective_query": effective,
            "topic_switched": False,
            "retrieval_concepts": self._default_retrieval_concepts(effective),
        }

    def analyze(self, query: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        history = history or []
        history_text = "\n".join(
            f"{m.get('role', 'user').upper()}: {m.get('content', '')}" for m in history[-8:]
        )
        sys_prompt = """You analyze legal research queries for Ask MARE-Juris (Indian law).
Do NOT use compliance/business profiling. No fixed question count.
Decide if ONE natural clarification is needed before answering.
Return ONLY JSON:
{
  "intent": "string",
  "topic": "string",
  "jurisdiction": "India or specific if user stated",
  "entities": [],
  "facts_explicitly_provided": [],
  "requested_information": [],
  "ambiguities": [],
  "missing_information": [],
  "requires_followup": false,
  "followup_question": null,
  "followup_reason": null,
  "effective_query": "full query including relevant prior user context",
  "topic_switched": false,
  "retrieval_concepts": ["phrases for semantic/BM25 retrieval only — not answers"]
}
Rules:
- Do not invent facts (state, dates, contract type).
- Ask follow-up ONLY if missing info could materially change the legal answer.
- For general statute questions (e.g. 'What is the Consumer Protection Act?'), requires_followup=false.
- Merge prior user question with short clarifications (e.g. user says 'Chennai' after eviction question).
- If user clearly changes topic, set topic_switched=true and effective_query to the new question only."""

        user_prompt = f"Conversation:\n{history_text}\n\nLatest user message:\n{query.strip()}"
        try:
            result = self._call_llm_json(sys_prompt, user_prompt)
            if not result.get("effective_query"):
                result["effective_query"] = query.strip()
            if not result.get("retrieval_concepts"):
                result["retrieval_concepts"] = self._default_retrieval_concepts(result["effective_query"])
            return result
        except Exception as e:
            logger.warning(f"[QUERY_ANALYSIS] LLM failed, heuristic fallback: {e}")
            return self._heuristic_analysis(query, history)


legal_query_analysis_service = LegalQueryAnalysisService()
