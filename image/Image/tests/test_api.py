from fastapi.testclient import TestClient
from run_standalone import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_question_endpoint():
    response = client.post("/member2/questions", json={"question": "How much should I take?"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["safe_to_personalize"] is False
