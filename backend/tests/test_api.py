import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app
from backend.app.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_route53.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_login():
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@route53clone.com", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["email"] == "admin@route53clone.com"

def test_login_invalid():
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@route53clone.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_create_hosted_zone():
    response = client.post(
        "/api/hosted-zones",
        json={"name": "testzone.io", "description": "Test DNS Zone", "zone_type": "Public"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "testzone.io"
    assert data["zone_id"].startswith("Z")
    assert data["record_count"] >= 2  # default NS and SOA

def test_list_hosted_zones():
    response = client.get("/api/hosted-zones?page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1

def test_search_hosted_zones():
    response = client.get("/api/hosted-zones?search=testzone")
    assert response.status_code == 200
    data = response.json()
    assert any(item["name"] == "testzone.io" for item in data["items"])

def test_update_hosted_zone():
    zones = client.get("/api/hosted-zones").json()["items"]
    target_zone = [z for z in zones if z["name"] == "testzone.io"][0]
    
    response = client.put(
        f"/api/hosted-zones/{target_zone['id']}",
        json={"description": "Updated description"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["description"] == "Updated description"

def test_create_record():
    zones = client.get("/api/hosted-zones").json()["items"]
    target_zone = [z for z in zones if z["name"] == "testzone.io"][0]

    response = client.post(
        f"/api/hosted-zones/{target_zone['id']}/records",
        json={
            "name": "api",
            "type": "A",
            "ttl": 300,
            "value": "10.0.0.1"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "A"
    assert data["value"] == "10.0.0.1"
    assert "api.testzone.io" in data["name"]

def test_filter_records():
    zones = client.get("/api/hosted-zones").json()["items"]
    target_zone = [z for z in zones if z["name"] == "testzone.io"][0]

    response = client.get(f"/api/hosted-zones/{target_zone['id']}/records?type=A")
    assert response.status_code == 200
    data = response.json()
    assert all(r["type"] == "A" for r in data["items"])

def test_update_record():
    zones = client.get("/api/hosted-zones").json()["items"]
    target_zone = [z for z in zones if z["name"] == "testzone.io"][0]

    records = client.get(f"/api/hosted-zones/{target_zone['id']}/records?type=A").json()["items"]
    rec = records[0]

    response = client.put(
        f"/api/records/{rec['id']}",
        json={"ttl": 60, "value": "10.0.0.2"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ttl"] == 60
    assert data["value"] == "10.0.0.2"

def test_delete_record():
    zones = client.get("/api/hosted-zones").json()["items"]
    target_zone = [z for z in zones if z["name"] == "testzone.io"][0]

    records = client.get(f"/api/hosted-zones/{target_zone['id']}/records?type=A").json()["items"]
    rec = records[0]

    response = client.delete(f"/api/records/{rec['id']}")
    assert response.status_code == 200

def test_delete_hosted_zone():
    zones = client.get("/api/hosted-zones").json()["items"]
    target_zone = [z for z in zones if z["name"] == "testzone.io"][0]

    response = client.delete(f"/api/hosted-zones/{target_zone['id']}")
    assert response.status_code == 200

    # Verify not found
    get_res = client.get(f"/api/hosted-zones/{target_zone['id']}")
    assert get_res.status_code == 404
