from fastapi import FastAPI
from app.api.member2_router import router as member2_router

app = FastAPI(
    title="DAWAZ Member 2 API",
    description="Medicine reading and understanding module",
    version="1.0.0",
)

app.include_router(member2_router)

@app.get("/health")
def health():
    return {"status": "ok", "module": "member2"}
