import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "MARE-Juris API"
    API_V1_STR: str = "/api/v1"
    
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL: str = ""
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_DB_URL: Optional[str] = None

    # Brevo Email Configuration
    BREVO_SMTP_HOST: str = "smtp-relay.brevo.com"
    BREVO_SMTP_PORT: int = 587
    BREVO_SMTP_USERNAME: str = ""
    BREVO_SMTP_PASSWORD: str = ""
    BREVO_API_KEY: str = ""
    BREVO_FROM_EMAIL: str = "nikhil.agrawal2023@vitstudent.ac.in"
    BREVO_FROM_NAME: str = "MARE-Juris Legal"

    # Resend Email Configuration (Optional)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "noreply@yourdomain.com"
    RESEND_FROM_NAME: str = "MARE-Juris Legal"

    # Gemini LLM Configuration
    GEMINI_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
