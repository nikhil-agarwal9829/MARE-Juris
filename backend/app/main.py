from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.health import router as health_router
from app.api.v1.chat import router as chat_router
from app.api.v1.compliance import router as compliance_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multi-Agent Retrieval-Enhanced Framework for Intelligent Legal Decision Support API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

import os

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url.rstrip("/"))

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["Infrastructure"])
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(compliance_router, prefix=f"{settings.API_V1_STR}/compliance", tags=["Compliance Agent"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to MARE-Juris API Backend",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
