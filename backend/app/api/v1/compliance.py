from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from app.services.compliance_service import ComplianceAgentService
from app.services.web_research_service import WebResearchService
from app.auth.deps import get_current_user
from app.db.supabase import get_supabase_admin_client

router = APIRouter()
compliance_service = ComplianceAgentService()
web_research_service = WebResearchService()


def _raise_http_from_error(exc: Exception) -> None:
    msg = str(exc)
    lower = msg.lower()
    if "gemini_api_key is not set" in lower:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured on the backend. Add it to .env and restart the API server.",
        )
    if "429" in msg or "quota" in lower or "rate limit" in lower:
        raise HTTPException(
            status_code=503,
            detail=(
                "Gemini API quota is temporarily exceeded. The server will use offline question templates when possible; "
                "retry in a few minutes or use a key with available quota."
            ),
        )
    raise HTTPException(status_code=500, detail=msg)


class IntentRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=2000)


class StartRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=2000)


class QuestionRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=2000)
    intent: Dict[str, Any]
    answers: Dict[str, str] = Field(default_factory=dict)
    asked_question_ids: List[str] = Field(default_factory=list)
    asked_count: int = Field(default=0, ge=0, le=10)


class AnalyzeRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=2000)
    intent: Dict[str, Any]
    answers: Dict[str, str] = Field(default_factory=dict)
    profile: Optional[Dict[str, Any]] = None


class SaveAssessmentRequest(BaseModel):
    title: str
    business_type: str
    location: str
    matrix_data: Dict[str, Any]


@router.post("/intent")
async def extract_intent(req: IntentRequest):
    try:
        result = compliance_service.extract_business_intent(req.prompt)
        return {"status": "success", "intent": result}
    except Exception as e:
        _raise_http_from_error(e)


@router.post("/questions")
async def generate_questions(req: QuestionRequest):
    try:
        payload = compliance_service.generate_adaptive_questions(
            query=req.query,
            intent=req.intent,
            answers=req.answers,
            asked_question_ids=req.asked_question_ids,
            asked_count=req.asked_count,
        )
        return {"status": "success", **payload}
    except Exception as e:
        _raise_http_from_error(e)


@router.post("/analyze")
async def start_compliance_session(req: StartRequest):
    """Initial analyze: intent + first question batch (query-driven, single LLM call)."""
    try:
        payload = compliance_service.start_compliance_session(req.query)
        return {"status": "success", **payload}
    except Exception as e:
        _raise_http_from_error(e)


@router.post("/roadmap")
async def generate_roadmap(req: AnalyzeRequest):
    try:
        profile = req.profile or compliance_service.build_final_profile(
            req.query, req.intent, req.answers, len(req.answers)
        )
        research_query = compliance_service.research_query_for_profile(profile)
        research = await web_research_service.process_query(research_query)
        research_context = research.get("answer") or ""

        matrix = compliance_service.analyze_compliance_roadmap(
            query=req.query,
            intent=req.intent,
            answers=req.answers,
            profile=profile,
            research_context=research_context,
        )
        return {
            "status": "success",
            "profile": profile,
            "complianceMatrix": matrix,
            "requirements": (
                matrix.get("mandatoryRequirements", [])
                + matrix.get("conditionalRequirements", [])
                + matrix.get("needsVerificationRequirements", [])
            ),
            "roadmap": matrix.get("roadmapSteps", []),
            "sources": matrix.get("officialSources", []),
            "research": research,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save")
async def save_assessment(req: SaveAssessmentRequest, current_user=Depends(get_current_user)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required to save compliance assessments.")

    try:
        supabase = get_supabase_admin_client()
        res = supabase.table("compliance_assessments").insert({
            "user_id": user_id,
            "title": req.title,
            "business_type": req.business_type,
            "location": req.location,
            "matrix_data": req.matrix_data
        }).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        return {"status": "success", "message": "Assessment saved in local session.", "mock_id": "local-saved"}


@router.get("/history")
async def get_history(current_user=Depends(get_current_user)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")

    try:
        supabase = get_supabase_admin_client()
        res = supabase.table("compliance_assessments").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return {"status": "success", "assessments": res.data or []}
    except Exception as e:
        return {"status": "success", "assessments": []}
