import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "llm_provider" in data


def test_dashboard_api():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "incidents" in data
    assert "resources" in data
    assert data["metrics"]["active_incidents_count"] >= 1


def test_create_and_resolve_incident():
    # 1. Create incident
    payload = {
        "title": "Apartment Fire on 5th Ave",
        "description": "Flames showing from 3rd floor apartment window.",
        "location": "5th Ave & Pine",
        "people_affected": 10,
        "severity": 8,
        "urgency": 8,
        "required_resources": {"fire_unit": 1, "ambulance": 1}
    }
    create_resp = client.post("/api/incidents", json=payload)
    assert create_resp.status_code == 201
    created_inc = create_resp.json()
    inc_id = created_inc["incident_id"]
    assert inc_id.startswith("INC-")

    # 2. Get incident
    get_resp = client.get(f"/api/incidents/{inc_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["incident_id"] == inc_id

    # 3. Resolve incident
    resolve_resp = client.post(f"/api/incidents/{inc_id}/resolve")
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["incident"]["status"] == "resolved"


def test_demo_scenarios_and_approval():
    # Reset
    reset_resp = client.post("/api/demo/reset")
    assert reset_resp.status_code == 200

    # Load standard scenario
    load_resp = client.post("/api/demo/load-scenario")
    assert load_resp.status_code == 200
    assert load_resp.json()["incidents_count"] == 4

    # Trigger critical chemical explosion incident
    crit_resp = client.post("/api/demo/new-critical-incident")
    assert crit_resp.status_code == 200
    crit_data = crit_resp.json()
    assert crit_data["status"] == "success"
    assert crit_data["replanning_event"] is not None

    # Test Human Approval endpoint
    approve_resp = client.post(
        "/api/response/plan/approve",
        json={"action": "approve", "reviewer_notes": "Approved by Tactical Commander on Duty"}
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["current_approval_status"] == "approved"
