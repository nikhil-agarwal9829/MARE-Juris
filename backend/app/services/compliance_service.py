import json
import logging
from typing import Dict, Any, List, Set, Optional

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger("compliance_service")

GEMINI_API_KEY = settings.GEMINI_API_KEY

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

MAX_TOTAL_QUESTIONS = 10
INITIAL_QUESTION_BATCH = 5

# Prefer models with separate free-tier quotas; override via GEMINI_COMPLIANCE_MODEL if needed.
DEFAULT_MODEL = "gemini-3.5-flash-lite"
MODEL_FALLBACKS = (
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
)


class ComplianceAgentService:
    def __init__(self):
        self.model_name = getattr(settings, "GEMINI_COMPLIANCE_MODEL", None) or DEFAULT_MODEL

    @staticmethod
    def _is_retryable_llm_error(exc: Exception) -> bool:
        msg = str(exc).lower()
        return any(
            token in msg
            for token in ("429", "quota", "rate limit", "resource exhausted", "404", "not found")
        )

    @staticmethod
    def _extract_response_text(response: Any) -> str:
        try:
            text = getattr(response, "text", None)
            if text:
                return text.strip()
        except Exception:
            pass
        candidates = getattr(response, "candidates", None) or []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            if not content:
                continue
            for part in getattr(content, "parts", []) or []:
                part_text = getattr(part, "text", None)
                if part_text:
                    return part_text.strip()
        raise ValueError("LLM returned an empty response.")

    def _model_chain(self) -> List[str]:
        chain: List[str] = []
        for name in (self.model_name, *MODEL_FALLBACKS):
            if name and name not in chain:
                chain.append(name)
        return chain

    def _call_llm_json(self, sys_prompt: str, user_prompt: str) -> Dict[str, Any]:
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set. Add it to backend/.env or the project root .env.")

        last_error: Optional[Exception] = None
        for model_name in self._model_chain():
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content([sys_prompt, f"User Input: {user_prompt}"])
                raw = self._extract_response_text(response)
                if raw.startswith("```json"):
                    raw = raw.replace("```json", "").replace("```", "").strip()
                elif raw.startswith("```"):
                    raw = raw.replace("```", "").strip()
                return json.loads(raw)
            except json.JSONDecodeError as e:
                logger.error(f"[COMPLIANCE_AGENT] JSON parse error ({model_name}): {e}")
                last_error = Exception("Failed to parse LLM response as JSON.")
            except Exception as e:
                logger.warning(f"[COMPLIANCE_AGENT] LLM call failed ({model_name}): {e}")
                last_error = e
                if self._is_retryable_llm_error(e):
                    continue
                raise

        if last_error:
            raise last_error
        raise RuntimeError("LLM call failed with no response.")

    def _heuristic_intent(self, user_prompt: str) -> Dict[str, Any]:
        """Query-shaped fallback when Gemini is unavailable (no fabricated location)."""
        text = user_prompt.lower()
        base = {
            "entity_type": "individual",
            "jurisdiction": "India",
            "location_known": False,
            "known_facts": [user_prompt.strip()],
            "unknown_critical_facts": ["state_or_rto", "new_or_renewal", "licence_class"],
        }

        if any(k in text for k in ("driving licence", "driving license", "learner", " driving license", " dl")):
            return {
                **base,
                "intent": "driving_licence_application",
                "request_type": "government_service",
                "subject": "driving licence",
                "unknown_critical_facts": [
                    "state_or_rto",
                    "new_or_renewal_or_duplicate",
                    "licence_class",
                    "learner_or_permanent",
                ],
            }
        if any(k in text for k in ("passport",)):
            return {
                **base,
                "intent": "passport_application",
                "request_type": "government_service",
                "subject": "passport",
                "unknown_critical_facts": ["state_or_city", "new_or_renewal", "adult_or_minor", "ordinary_or_tatkal"],
            }
        if any(k in text for k in ("restaurant", "cafe", "food", "eatery")):
            return {
                **base,
                "entity_type": "business",
                "intent": "open_restaurant",
                "request_type": "business_compliance",
                "subject": "restaurant",
                "unknown_critical_facts": ["city", "alcohol_service", "premises_type"],
            }
        if any(k in text for k in ("saas", "software", "startup", "tech company")):
            return {
                **base,
                "entity_type": "business",
                "intent": "start_saas_business",
                "request_type": "business_compliance",
                "subject": "SaaS business",
                "unknown_critical_facts": ["registration_state", "business_structure", "customer_geography"],
            }
        if any(k in text for k in ("register a company", "company registration", "incorporate")):
            return {
                **base,
                "entity_type": "business",
                "intent": "company_registration",
                "request_type": "registration",
                "subject": "company registration",
                "unknown_critical_facts": ["state_of_registration", "company_type", "director_count"],
            }

        return {
            **base,
            "intent": "general_compliance_request",
            "request_type": "personal_legal",
            "subject": user_prompt.strip()[:120],
            "unknown_critical_facts": ["jurisdiction_detail", "process_type"],
        }

    def _heuristic_questions(self, intent: Dict[str, Any]) -> List[Dict[str, Any]]:
        intent_key = intent.get("intent", "")
        if intent_key == "driving_licence_application":
            return [
                {
                    "id": "dl_state_rto",
                    "questionText": "Which state (and city/RTO area, if known) will you apply through?",
                    "type": "text",
                    "required": True,
                    "reason": "Driving licence processes are administered by the state RTO/transport department.",
                    "options": [],
                },
                {
                    "id": "dl_application_type",
                    "questionText": "What type of application is this?",
                    "type": "choice",
                    "required": True,
                    "reason": "Steps differ for new, renewal, duplicate, or address change.",
                    "options": [
                        {"label": "New learner's licence", "value": "new_learner"},
                        {"label": "Permanent driving licence (after learner)", "value": "permanent"},
                        {"label": "Renewal", "value": "renewal"},
                        {"label": "Duplicate / correction", "value": "duplicate_or_correction"},
                    ],
                },
                {
                    "id": "dl_vehicle_class",
                    "questionText": "Which vehicle class do you need on the licence?",
                    "type": "choice",
                    "required": True,
                    "reason": "Eligibility tests and documents depend on vehicle class.",
                    "options": [
                        {"label": "Two-wheeler (MCWG)", "value": "mcwg"},
                        {"label": "Light motor vehicle (LMV)", "value": "lmv"},
                        {"label": "Both two-wheeler and LMV", "value": "mcwg_lmv"},
                        {"label": "Transport / commercial (if applicable)", "value": "transport"},
                    ],
                },
                {
                    "id": "dl_applicant_age_band",
                    "questionText": "Is the applicant at least 18 years old (or 16 for certain gearless two-wheelers)?",
                    "type": "choice",
                    "required": True,
                    "reason": "Minimum age rules vary by vehicle class.",
                    "options": [
                        {"label": "Yes, 18 or older", "value": "adult_18_plus"},
                        {"label": "16–17 (gearless two-wheeler only)", "value": "age_16_17_gearless"},
                        {"label": "Applicant is a minor / unsure", "value": "minor_or_unsure"},
                    ],
                },
            ]

        return [
            {
                "id": "location_jurisdiction",
                "questionText": "Which city and state does this apply to?",
                "type": "text",
                "required": True,
                "reason": "Authorities and procedures depend on location.",
                "options": [],
            },
            {
                "id": "process_goal",
                "questionText": "What is the main outcome you need?",
                "type": "text",
                "required": True,
                "reason": "Clarifies whether this is registration, licence, renewal, or compliance.",
                "options": [],
            },
        ]

    def start_compliance_session(self, query: str) -> Dict[str, Any]:
        """One LLM call for intent + first questions; heuristic fallback if API fails."""
        sys_prompt = f"""You are a compliance assistant for India.
From the user's query, extract intent AND generate the first batch of clarifying questions (max {INITIAL_QUESTION_BATCH}).
Questions must match the query only (no unrelated domains).
Return ONLY JSON:
{{
  "intent": {{
    "intent": "string",
    "request_type": "government_service | business_compliance | personal_legal | registration",
    "subject": "string",
    "entity_type": "individual | business",
    "jurisdiction": "string",
    "location_known": true/false,
    "known_facts": [],
    "unknown_critical_facts": []
  }},
  "complete": false,
  "questions": [
    {{
      "id": "unique_id",
      "question": "string",
      "type": "text | choice",
      "required": true,
      "reason": "string",
      "options": [{{"label": "string", "value": "string"}}]
    }}
  ]
}}
Do not fabricate facts."""

        try:
            result = self._call_llm_json(sys_prompt, query)
            intent = result.get("intent") or {}
            raw_questions = result.get("questions") or []
            questions = self._validate_questions(raw_questions, set(), INITIAL_QUESTION_BATCH)
            complete = bool(result.get("complete", False)) or len(questions) == 0
            asked_count = len(questions)
            profile = self.build_final_profile(query, intent, {}, asked_count) if complete else None
            return {
                "intent": intent,
                "questions": questions,
                "complete": complete,
                "profile": profile,
                "asked_count": asked_count,
                "fallback_mode": False,
            }
        except Exception as e:
            logger.warning(f"[COMPLIANCE_AGENT] start_compliance_session LLM failed, using heuristic: {e}")
            intent = self._heuristic_intent(query)
            questions = self._heuristic_questions(intent)
            return {
                "intent": intent,
                "questions": questions,
                "complete": False,
                "profile": None,
                "asked_count": len(questions),
                "fallback_mode": True,
                "fallback_reason": str(e),
            }

    def extract_business_intent(self, user_prompt: str) -> Dict[str, Any]:
        """Extract structured intent from natural language input using LLM."""
        logger.info(f"[COMPLIANCE_AGENT] Extracting intent from prompt: {user_prompt[:50]}...")

        sys_prompt = """You are a compliance and government-services intent parser for Indian law and administration.
Extract structured parameters from the user's request. The user might start a business, apply for a government service (passport, driving licence), register a company, obtain a licence or permit, etc.
Return ONLY a valid JSON object matching this schema:
{
  "intent": "string (e.g. passport_application, start_saas_business, driving_licence)",
  "request_type": "string (government_service | business_compliance | personal_legal | registration)",
  "subject": "string (e.g. passport, SaaS business)",
  "entity_type": "string (individual | business)",
  "jurisdiction": "string (e.g. India, Tamil Nadu, Chennai)",
  "location_known": true/false,
  "known_facts": ["facts explicitly stated in the prompt"],
  "unknown_critical_facts": ["missing facts that could change requirements"]
}
Do not add markdown formatting or commentary. Do not fabricate facts."""

        try:
            return self._call_llm_json(sys_prompt, user_prompt)
        except Exception as e:
            logger.warning(f"[COMPLIANCE_AGENT] intent LLM failed, heuristic fallback: {e}")
            return self._heuristic_intent(user_prompt)

    def _normalize_question(self, raw: Dict[str, Any], existing_ids: Set[str]) -> Optional[Dict[str, Any]]:
        qid = str(raw.get("id") or "").strip()
        if not qid or qid in existing_ids:
            return None

        text = (
            raw.get("questionText")
            or raw.get("question")
            or raw.get("text")
            or ""
        ).strip()
        if not text:
            return None

        qtype = str(raw.get("type") or "choice").lower()
        options = raw.get("options") or []
        if not isinstance(options, list):
            options = []
        if qtype == "text" or len(options) == 0:
            qtype = "text"
            options = []

        return {
            "id": qid,
            "questionText": text,
            "type": qtype,
            "required": bool(raw.get("required", True)),
            "reason": str(raw.get("reason") or "").strip(),
            "options": options,
        }

    def _validate_questions(
        self,
        raw_questions: List[Dict[str, Any]],
        existing_ids: Set[str],
        max_new: int,
    ) -> List[Dict[str, Any]]:
        normalized: List[Dict[str, Any]] = []
        seen: Set[str] = set(existing_ids)

        for raw in raw_questions:
            if len(normalized) >= max_new:
                break
            item = self._normalize_question(raw, seen)
            if item:
                normalized.append(item)
                seen.add(item["id"])

        return normalized

    def build_final_profile(
        self,
        query: str,
        intent: Dict[str, Any],
        answers: Dict[str, str],
        questions_asked: int,
    ) -> Dict[str, Any]:
        """Assemble structured profile after questioning; unknowns stay explicit."""
        location = answers.get("location") or answers.get("q_location") or intent.get("jurisdiction") or "unknown"
        if location == "India" and not intent.get("location_known", False):
            location = "unknown"

        facts: Dict[str, str] = {}
        for key, val in answers.items():
            if val and str(val).strip():
                facts[key] = str(val).strip()

        assumptions: List[str] = []
        for fact_key in intent.get("unknown_critical_facts") or []:
            if fact_key not in facts and not any(fact_key in k for k in facts):
                assumptions.append(f"{fact_key}: unknown")

        return {
            "request": query,
            "intent": intent.get("intent", "unknown"),
            "domain": intent.get("request_type", "unknown"),
            "entity_type": intent.get("entity_type", "unknown"),
            "jurisdiction": intent.get("jurisdiction", "India"),
            "location": location,
            "subject": intent.get("subject", ""),
            "facts": facts,
            "answers": answers,
            "assumptions": assumptions,
            "questions_asked": questions_asked,
            "intent_detail": intent,
        }

    def generate_adaptive_questions(
        self,
        query: str,
        intent: Dict[str, Any],
        answers: Optional[Dict[str, str]] = None,
        asked_question_ids: Optional[List[str]] = None,
        asked_count: int = 0,
    ) -> Dict[str, Any]:
        """Generate the next batch of adaptive questions (max 10 total across the session)."""
        answers = answers or {}
        asked_question_ids = asked_question_ids or []
        existing_ids = set(asked_question_ids)

        remaining = MAX_TOTAL_QUESTIONS - asked_count
        if remaining <= 0:
            profile = self.build_final_profile(query, intent, answers, asked_count)
            return {"questions": [], "complete": True, "profile": profile, "asked_count": asked_count}

        is_follow_up = asked_count > 0
        batch_cap = min(INITIAL_QUESTION_BATCH if not is_follow_up else 5, remaining)

        sys_prompt = f"""You are a legal compliance expert assistant for India.
Generate the minimum useful NEXT questions for this user's request. Questions must match the detected intent only — never ask about unrelated domains (e.g. no restaurant questions for passport requests).

Rules:
- Hard limit: at most {batch_cap} questions in this batch; {remaining} questions remain before the absolute cap of {MAX_TOTAL_QUESTIONS}.
- Do NOT repeat question IDs or topics already answered.
- Each question needs a clear reason.
- Ask only information that can change requirements, authority, procedure, documents, eligibility, fees, or timeline.
- Do not ask for passwords, OTPs, or bank credentials.
- Set "complete": true if no further questions are needed; otherwise false.

Return ONLY valid JSON:
{{
  "complete": false,
  "questions": [
    {{
      "id": "unique_snake_case_id",
      "question": "string",
      "type": "text | choice",
      "required": true,
      "reason": "why this matters",
      "options": [{{"label": "string", "value": "string"}}]
    }}
  ]
}}
For open-ended questions use type "text" and an empty options array."""

        payload = {
            "original_query": query,
            "intent_profile": intent,
            "answers_so_far": answers,
            "already_asked_question_ids": list(existing_ids),
            "questions_already_asked_count": asked_count,
            "max_new_questions": batch_cap,
        }

        try:
            result = self._call_llm_json(sys_prompt, json.dumps(payload, indent=2))
        except Exception as e:
            logger.warning(f"[COMPLIANCE_AGENT] follow-up questions LLM failed: {e}")
            if asked_count == 0:
                questions = self._heuristic_questions(intent)
                return {
                    "questions": questions,
                    "complete": False,
                    "profile": None,
                    "asked_count": len(questions),
                    "fallback_mode": True,
                }
            profile = self.build_final_profile(query, intent, answers, asked_count)
            return {
                "questions": [],
                "complete": True,
                "profile": profile,
                "asked_count": asked_count,
                "fallback_mode": True,
            }

        llm_complete = bool(result.get("complete", False))
        raw_questions = result.get("questions") or []
        if not isinstance(raw_questions, list):
            raw_questions = []

        questions = self._validate_questions(raw_questions, existing_ids, batch_cap)
        new_total = asked_count + len(questions)
        complete = llm_complete or len(questions) == 0 or new_total >= MAX_TOTAL_QUESTIONS

        profile = None
        if complete:
            profile = self.build_final_profile(query, intent, answers, new_total if questions else asked_count)

        return {
            "questions": questions,
            "complete": complete,
            "profile": profile,
            "asked_count": new_total if questions else asked_count,
        }

    def analyze_compliance_roadmap(
        self,
        query: str,
        intent: Dict[str, Any],
        answers: Dict[str, str],
        profile: Optional[Dict[str, Any]] = None,
        research_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate compliance roadmap from final profile; optional web-research context."""
        final_profile = profile or self.build_final_profile(
            query,
            intent,
            answers,
            len(answers),
        )

        research_block = ""
        if research_context:
            research_block = f"\nOfficial-source research summary (use only if consistent with profile):\n{research_context}\n"

        sys_prompt = f"""You are an expert Indian legal compliance advisor.
Based on the final user profile below, generate a comprehensive compliance or application roadmap.
Prioritize official sources (India Code, central/state portals, ministries, regulators). Do not invent licences, fees, deadlines, documents, authorities, or URLs.
If you cannot verify a requirement, put it in needsVerificationRequirements with status "NEEDS VERIFICATION" and explain why.
{research_block}
Return ONLY a valid JSON object matching this exact schema:
{{
  "businessProfile": {{
    "businessType": "string",
    "nameOrDesc": "string",
    "city": "string",
    "state": "string",
    "country": "India",
    "jurisdictionSummary": "string"
  }},
  "summaryStats": {{
    "totalMandatory": 0,
    "totalConditional": 0,
    "totalNeedsVerification": 0,
    "totalChecklistItems": 0
  }},
  "mandatoryRequirements": [
    {{
      "id": "string",
      "title": "string",
      "category": "string",
      "status": "MANDATORY",
      "authority": "string",
      "jurisdiction": "string",
      "purpose": "string",
      "documents": ["string"],
      "applicationUrl": "string",
      "officialSource": "string",
      "renewalPeriod": "string"
    }}
  ],
  "conditionalRequirements": [
    {{
      "id": "string",
      "title": "string",
      "category": "string",
      "status": "CONDITIONAL",
      "condition": "string",
      "authority": "string",
      "jurisdiction": "string",
      "purpose": "string",
      "documents": ["string"],
      "applicationUrl": "string",
      "officialSource": "string",
      "renewalPeriod": "string"
    }}
  ],
  "needsVerificationRequirements": [
    {{
      "id": "string",
      "title": "string",
      "category": "string",
      "status": "NEEDS VERIFICATION",
      "condition": "string",
      "authority": "string",
      "purpose": "string",
      "documents": ["string"],
      "applicationUrl": "string",
      "officialSource": "string",
      "renewalPeriod": "string"
    }}
  ],
  "documentChecklist": [
    {{
      "id": "string",
      "name": "string",
      "category": "string"
    }}
  ],
  "roadmapSteps": [
    {{
      "step": 1,
      "title": "string",
      "desc": "string"
    }}
  ],
  "officialSources": [
    {{
      "title": "string",
      "url": "string",
      "authority": "string"
    }}
  ],
  "userProfile": {{}}
}}
Do not add markdown formatting or commentary."""

        user_input = json.dumps({"query": query, "final_profile": final_profile}, indent=2)
        result = self._call_llm_json(sys_prompt, user_input)
        result["userProfile"] = final_profile
        result["summaryStats"] = {
            "totalMandatory": len(result.get("mandatoryRequirements", [])),
            "totalConditional": len(result.get("conditionalRequirements", [])),
            "totalNeedsVerification": len(result.get("needsVerificationRequirements", [])),
            "totalChecklistItems": len(result.get("documentChecklist", [])),
        }
        return result

    def research_query_for_profile(self, profile: Dict[str, Any]) -> str:
        """Build a concise research query from the final profile."""
        parts = [
            profile.get("request") or profile.get("subject") or "",
            f"jurisdiction: {profile.get('jurisdiction', 'India')}",
            f"intent: {profile.get('intent', '')}",
        ]
        facts = profile.get("facts") or {}
        if facts:
            parts.append("facts: " + ", ".join(f"{k}={v}" for k, v in list(facts.items())[:8]))
        return " | ".join(p for p in parts if p)
