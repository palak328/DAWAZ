
from fastapi import FastAPI
from app.api.member2_router import router

app = FastAPI(
    title="DAWAZ Backend A",
    description="Medicine understanding and prescription intelligence API",
    version="1.0.0"
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "message": "DAWAZ Backend A is running",
        "status": "healthy"
    }
