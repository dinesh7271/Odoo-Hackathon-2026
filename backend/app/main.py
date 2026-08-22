from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.models import Base
from app.api import auth, leaves

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup.
    # Safe to call multiple times as it only creates tables if they don't exist.
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Dayflow HRM API",
    description="Backend API for Dayflow Human Resource Management System",
    version="1.0.0",
    lifespan=lifespan
)

# Include API routers
app.include_router(auth.router)
app.include_router(leaves.router)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this in production, but wildcard is fine for hackathon dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    """
    Basic health check endpoint to verify backend status.
    """
    return {
        "status": "ok",
        "service": "Dayflow Backend API"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
