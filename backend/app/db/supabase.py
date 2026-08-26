from supabase import create_client, Client
from app.core.config import settings


def get_supabase_client(jwt_token: str | None = None) -> Client:
    """
    Returns a Supabase client scoped to an authenticated user's JWT token (or anon client if none).
    Subject to Row Level Security (RLS).
    """
    if not settings.NEXT_PUBLIC_SUPABASE_URL or not settings.NEXT_PUBLIC_SUPABASE_ANON_KEY:
        raise ValueError("Supabase URL and Anon Key must be configured.")
    
    client = create_client(settings.NEXT_PUBLIC_SUPABASE_URL, settings.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    if jwt_token:
        client.postgrest.auth(jwt_token)
        
    return client


def get_supabase_admin_client() -> Client:
    """
    Returns a privileged Supabase client using SUPABASE_SERVICE_ROLE_KEY.
    Bypasses Row Level Security (RLS).
    Must strictly be used for backend administrative tasks only.
    """
    if not settings.NEXT_PUBLIC_SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("Supabase URL and Service Role Key must be configured for admin client.")
    
    return create_client(settings.NEXT_PUBLIC_SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
