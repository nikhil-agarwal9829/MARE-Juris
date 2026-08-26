from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.health import router as health_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multi-Agent Retrieval-Enhanced Framework for Intelligent Legal Decision Support API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["Infrastructure"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to MARE-Juris API Backend",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
