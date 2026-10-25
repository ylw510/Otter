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


def test_api_v1_words_patch_translation():
    with TestClient(app) as client:
        created = client.post(
            "/api/v1/words",
            json={"word": "bracing for", "source_site": "test"},
        )
        assert created.status_code == 200
        word_id = created.json()["id"]

        patched = client.patch(
            f"/api/v1/words/{word_id}",
            json={"translation": "为…做准备；应对"},
        )
        assert patched.status_code == 200
        assert patched.json()["translation"] == "为…做准备；应对"

        missing = client.patch(
            "/api/v1/words/nonexistent-id",
            json={"translation": "x"},
        )
        assert missing.status_code == 404
