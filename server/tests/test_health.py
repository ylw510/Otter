from fastapi.testclient import TestClient

from main import APP_SERVICE, app


def test_health():
    with TestClient(app) as client:
        r = client.get("/health")
        assert r.status_code == 200
        body = r.json()
        assert body["ok"] is True
        assert body["service"] == APP_SERVICE
        assert "api_version" in body


def test_api_v1_words_returns_list_or_empty():
    with TestClient(app) as client:
        r = client.get("/api/v1/words")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
