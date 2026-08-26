from fastapi import APIRouter, status
from app.core.config import settings
from app.db.supabase import get_supabase_client

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Infrastructure Health Check Endpoint.
    Verifies FastAPI server running state, environment configuration, and Supabase client setup.
    """
    supabase_configured = bool(settings.NEXT_PUBLIC_SUPABASE_URL and settings.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    supabase_admin_configured = bool(settings.SUPABASE_SERVICE_ROLE_KEY)
    resend_configured = bool(settings.RESEND_API_KEY)

    db_connection_status = "untested"
    if supabase_configured:
        try:
            client = get_supabase_client()
            # Simple ping test to verify client setup
            response = client.from_("legal_sources").select("count", count="exact").limit(1).execute()
            db_connection_status = "healthy"
        except Exception as e:
            db_connection_status = f"error: {str(e)}"

    return {
        "status": "online",
        "service": "MARE-Juris FastAPI Infrastructure Backend",
        "version": "0.1.0",
        "configurations": {
            "supabase_configured": supabase_configured,
            "supabase_admin_configured": supabase_admin_configured,
            "resend_configured": resend_configured,
            "database": db_connection_status,
        }
    }
