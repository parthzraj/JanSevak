import os
import sys
import tempfile
from pathlib import Path

# Must be set BEFORE the app is imported (settings are read at import time).
_tmp = tempfile.mkdtemp(prefix="prajapulse_test_")
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["UPLOAD_DIR"] = f"{_tmp}/uploads"
os.environ["AI_SERVICE_URL"] = "http://ai.test"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["DAILY_POINTS_CAP"] = "60"
os.environ["STRICT_REPORT_RULES"] = "false"  # old tests post short demo reports; the quality rules have their own tests
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models import User  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def register(client, name="Test User", email="t@example.com", password="secret1", ward="Ward 1"):
    r = client.post("/api/auth/register", json={"name": name, "email": email, "password": password, "ward": ward})
    assert r.status_code == 201, r.text
    body = r.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]


@pytest.fixture
def make_user(client):
    return lambda **kw: register(client, **kw)


@pytest.fixture
def official_headers(client):
    headers, user = register(client, name="Officer", email="officer@example.com")
    with SessionLocal() as db:
        db.get(User, user["id"]).role = "official"
        db.commit()
    return headers


ISSUE = {
    "title": "Pothole on Main Road",
    "description": "Large pothole near the bus stop, dangerous for bikes.",
    "category": "Roads",
    "priority": "High",
}
