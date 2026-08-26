from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.supabase import get_supabase_client
from supabase import Client

security = HTTPBearer(auto_error=False)


async def get_current_user_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    """
    Extracts Bearer Token from HTTP Authorization Header.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


async def get_current_user(token: str = Depends(get_current_user_token)) -> dict:
    """
    Validates Supabase JWT token and retrieves authenticated user object.
    """
    try:
        supabase: Client = get_supabase_client(jwt_token=token)
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token or user session expired",
            )
        
        return {
            "id": user_response.user.id,
            "email": user_response.user.email,
            "user_metadata": user_response.user.user_metadata,
            "token": token
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )
