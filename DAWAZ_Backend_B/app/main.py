from fastapi import FastAPI
from app.database import Base, engine

app = FastAPI(
    title="DAWAZ Backend B",
    description="Platform and voice-processing API for DAWAZ",
    version="1.0.0"
)

# Create database tables
from app.models.user import User
Base.metadata.create_all(bind=engine)


@app.get("/")
def home():
    return {
        "message": "Welcome to DAWAZ Backend B",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "DAWAZ Backend B",
        "database": "connected"
    }
