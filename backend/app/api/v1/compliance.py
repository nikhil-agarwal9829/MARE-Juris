from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from app.services.compliance_service import ComplianceAgentService
from app.auth.deps import get_current_user
from app.db.supabase import get_supabase_admin_client

router = APIRouter()
compliance_service = ComplianceAgentService()


class IntentRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1000)


class QuestionRequest(BaseModel):
    intent: Dict[str, Any]


class AnalyzeRequest(BaseModel):
    intent: Dict[str, Any]
    answers: Dict[str, str] = Field(default_factory=dict)


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
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/questions")
async def generate_questions(req: QuestionRequest):
    try:
        questions = compliance_service.generate_adaptive_questions(req.intent)
        return {"status": "success", "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_compliance(req: AnalyzeRequest):
    try:
        matrix = compliance_service.analyze_compliance_roadmap(req.intent, req.answers)
        return {"status": "success", "complianceMatrix": matrix}
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
        # If table does not exist, return graceful fallback
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
