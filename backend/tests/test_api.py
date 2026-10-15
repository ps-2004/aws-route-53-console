
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models import User


# Use a separate SQLite database for tests.
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_route53.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # Create tables in the test database.
    Base.metadata.create_all(bind=engine)

    # Seed the admin account in the SAME database used by TestClient.
    db = TestingSessionLocal()
    try:
        admin = (
            db.query(User)
            .filter(User.email == "admin@route53clone.com")
            .first()
        )

        if not admin:
            db.add(
                User(
                    email="admin@route53clone.com",
                    password_hash="admin123",
                    name="Administrator",
                )
            )
            db.commit()
    finally:
        db.close()

    yield

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


client = TestClient(app)


def test_login():
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@route53clone.com",
            "password": "admin123",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["email"] == "admin@route53clone.com"


def test_login_invalid():
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@route53clone.com",
            "password": "wrongpassword",
        },
    )

    assert response.status_code == 401


def test_create_hosted_zone():
    response = client.post(
        "/api/hosted-zones",
        json={
            "name": "testzone.io",
            "description": "Test DNS Zone",
            "zone_type": "Public",
        },
    )

    assert response.status_code == 201

    data = response.json()
    assert data["name"] == "testzone.io"
    assert data["zone_id"].startswith("Z")
    assert data["record_count"] >= 2


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
    assert any(
        item["name"] == "testzone.io"
        for item in data["items"]
    )


def test_update_hosted_zone():
    zones = client.get("/api/hosted-zones").json()["items"]
    target_zone = next(
        z for z in zones if z["name"] == "testzone.io"
    )

    response = client.put(
        f"/api/hosted-zones/{target_zone['id']}",
        json={"description": "Updated description"},
    )

    assert response.status_code == 200
    assert response.json()["description"] == "Updated description"


def test_create_record():
    zones = client.get("/api/hosted-zones").json()["items"]
    target_zone = next(
        z for z in zones if z["name"] == "testzone.io"
    )

    response = client.post(
        f"/api/hosted-zones/{target_zone['id']}/records",
        json={
            "name": "api",
            "type": "A",
            "ttl": 300,
            "value": "10.0.0.1",
        },
    )

    assert response.status_code == 201

    data = response.json()
    assert data["type"] == "A"
    assert data["value"] == "10.0.0.1"
    assert "api.testzone.io" in data["name"]


def test_filter_records():
    zones = client.get("/api/hosted-zones").json()["items"]
    target_zone = next(
        z for z in zones if z["name"] == "testzone.io"
    )

    response = client.get(
        f"/api/hosted-zones/{target_zone['id']}/records?type=A"
    )

    assert response.status_code == 200

    data = response.json()
    assert all(r["type"] == "A" for r in data["items"])


def test_update_record():
    zones = client.get("/api/hosted-zones").json()["items"]
    target_zone = next(
        z for z in zones if z["name"] == "testzone.io"
    )

    records = client.get(
        f"/api/hosted-zones/{target_zone['id']}/records?type=A"
    ).json()["items"]

    assert records, "Expected at least one A record"
    record = records[0]

    response = client.put(
        f"/api/records/{record['id']}",
        json={"ttl": 60, "value": "10.0.0.2"},
    )

    assert response.status_code == 200
    assert response.json()["ttl"] == 60
    assert response.json()["value"] == "10.0.0.2"


def test_delete_record():
    zones = client.get("/api/hosted-zones").json()["items"]
    target_zone = next(
        z for z in zones if z["name"] == "testzone.io"
    )

    records = client.get(
        f"/api/hosted-zones/{target_zone['id']}/records?type=A"
    ).json()["items"]

    assert records, "Expected at least one A record"
    record = records[0]

    response = client.delete(f"/api/records/{record['id']}")

    assert response.status_code == 200


def test_bulk_delete_records():
    zones = client.get("/api/hosted-zones").json()["items"]
    target_zone = next(
        z for z in zones if z["name"] == "testzone.io"
    )

    # Create two temporary records to delete.
    record_ids = []

    for name, value in [
        ("bulk1", "10.0.0.11"),
        ("bulk2", "10.0.0.12"),
    ]:
        response = client.post(
            f"/api/hosted-zones/{target_zone['id']}/records",
            json={
                "name": name,
                "type": "A",
                "ttl": 300,
                "value": value,
            },
        )

        assert response.status_code == 201
        record_ids.append(response.json()["id"])

    response = client.post(
        "/api/records/bulk-delete",
        json={"ids": record_ids},
    )

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["deleted_count"] == 2

    for record_id in record_ids:
        check = client.get(f"/api/records/{record_id}")
        assert check.status_code == 404


def test_delete_hosted_zone():
    zones = client.get("/api/hosted-zones").json()["items"]
    target_zone = next(
        z for z in zones if z["name"] == "testzone.io"
    )

    response = client.delete(
        f"/api/hosted-zones/{target_zone['id']}"
    )

    assert response.status_code == 200

    # Verify the zone was deleted.
    get_response = client.get(
        f"/api/hosted-zones/{target_zone['id']}"
    )

    assert get_response.status_code == 404


def test_import_records():
    # Create a dedicated hosted zone for this test.
    zone_response = client.post(
        "/api/hosted-zones",
        json={
            "name": "import-test.io",
            "description": "Record import test",
            "zone_type": "Public",
        },
    )

    assert zone_response.status_code == 201
    zone = zone_response.json()

    response = client.post(
        f"/api/hosted-zones/{zone['id']}/import",
        json={
            "records": [
                {
                    "name": "imported-api",
                    "type": "A",
                    "ttl": 300,
                    "value": "10.0.0.25",
                }
            ]
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["imported_count"] == 1
    assert data["records"][0]["type"] == "A"
    assert data["records"][0]["value"] == "10.0.0.25"

    # Verify that the imported record can be retrieved.
    records_response = client.get(
        f"/api/hosted-zones/{zone['id']}/records"
    )

    assert records_response.status_code == 200
    assert any(
        record["name"] == "imported-api.import-test.io"
        and record["value"] == "10.0.0.25"
        for record in records_response.json()["items"]
    )

def test_export_hosted_zone_json():
    zone_response = client.post(
        "/api/hosted-zones",
        json={
            "name": "json-export-test.io",
            "description": "JSON export test",
            "zone_type": "Public",
        },
    )
    assert zone_response.status_code == 201
    zone = zone_response.json()

    record_response = client.post(
        f"/api/hosted-zones/{zone['id']}/records",
        json={
            "name": "api",
            "type": "A",
            "ttl": 300,
            "value": "10.0.0.50",
        },
    )
    assert record_response.status_code == 201

    response = client.get(
        f"/api/hosted-zones/{zone['id']}/export?format=json"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["zone"]["name"] == "json-export-test.io"
    assert any(
        record["name"] == "api.json-export-test.io"
        and record["type"] == "A"
        and record["value"] == "10.0.0.50"
        for record in data["records"]
    )


def test_export_hosted_zone_bind():
    zone_response = client.post(
        "/api/hosted-zones",
        json={
            "name": "bind-export-test.io",
            "description": "BIND export test",
            "zone_type": "Public",
        },
    )
    assert zone_response.status_code == 201
    zone = zone_response.json()

    record_response = client.post(
        f"/api/hosted-zones/{zone['id']}/records",
        json={
            "name": "api",
            "type": "A",
            "ttl": 300,
            "value": "10.0.0.60",
        },
    )
    assert record_response.status_code == 201

    response = client.get(
        f"/api/hosted-zones/{zone['id']}/export?format=bind"
    )

    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]
    assert "$ORIGIN bind-export-test.io." in response.text
    assert (
        "api.bind-export-test.io 300 IN A 10.0.0.60"
        in response.text
    )
