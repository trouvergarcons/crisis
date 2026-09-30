import pytest
from backend.app.engines.allocation_engine import AllocationEngine
from backend.app.engines.replanning_engine import ReplanningEngine
from backend.app.models.resource import ResourceStatus


def test_resource_preemption_and_reallocation_scenario():
    """
    Required test scenario:
    Initial: AMB-01 -> Road Accident
    New: Chemical Explosion with higher priority
    Expected: AMB-01 should be considered for reallocation according to allocation rules.
    The test should verify that the allocation engine records the change.
    """
    alloc_engine = AllocationEngine()

    resources = {
        "AMB-01": {
            "resource_id": "AMB-01",
            "resource_type": "ambulance",
            "name": "Medic Ambulance 01",
            "status": ResourceStatus.ASSIGNED.value,
            "latitude": 37.77,
            "longitude": -122.41,
            "availability": True
        }
    }

    # Initial state: only Road Accident exists and AMB-01 is assigned to it
    incidents = {
        "INC-002": {
            "incident_id": "INC-002",
            "title": "Road Accident",
            "priority_score": 71.0,
            "severity": 7,
            "urgency": 8,
            "required_resources": {"ambulance": 1},
            "status": "responding"
        }
    }

    initial_allocations = {"INC-002": ["AMB-01"]}

    # New emergency arrives: Chemical Explosion with much higher priority (99)
    incidents["INC-005"] = {
        "incident_id": "INC-005",
        "title": "Chemical Explosion",
        "priority_score": 99.0,
        "severity": 10,
        "urgency": 10,
        "required_resources": {"ambulance": 1},
        "status": "reported"
    }

    new_allocs, changes, conflicts, human_approval, approval_reasons = alloc_engine.allocate(
        incidents=incidents,
        resources=resources,
        existing_allocations=initial_allocations,
        trigger_reason="Chemical Explosion arrived"
    )

    # Verifications:
    # 1. Chemical explosion receives AMB-01
    assert "AMB-01" in new_allocs["INC-005"]
    assert "AMB-01" not in new_allocs["INC-002"]

    # 2. Change is explicitly recorded
    assert len(changes) == 1
    chg = changes[0]
    assert chg.resource_id == "AMB-01"
    assert chg.previous_incident_id == "INC-002"
    assert chg.new_incident_id == "INC-005"
    assert "Priority reallocation" in chg.reason

    # 3. Human approval was flagged
    assert human_approval is True
    assert any("Reallocated Medic Ambulance 01" in r for r in approval_reasons)


def test_resource_failure_replanning():
    """
    Test resource failure while assigned triggers reallocation or records deficit.
    """
    replan_engine = ReplanningEngine()

    resources = {
        "AMB-01": {
            "resource_id": "AMB-01",
            "resource_type": "ambulance",
            "name": "Medic Ambulance 01",
            "status": ResourceStatus.UNAVAILABLE.value,  # Broke down
            "latitude": 37.77,
            "longitude": -122.41,
            "availability": False
        },
        "AMB-02": {
            "resource_id": "AMB-02",
            "resource_type": "ambulance",
            "name": "Medic Ambulance 02",
            "status": ResourceStatus.AVAILABLE.value,
            "latitude": 37.78,
            "longitude": -122.42,
            "availability": True
        }
    }

    incidents = {
        "INC-001": {
            "incident_id": "INC-001",
            "title": "Building Collapse",
            "priority_score": 94.0,
            "severity": 9,
            "urgency": 10,
            "required_resources": {"ambulance": 1},
            "status": "responding"
        }
    }

    # Before state: INC-001 had AMB-01 which is now unavailable
    prev_allocs = {"INC-001": ["AMB-01"]}

    new_allocs, plan, changes, human_approval, reasons = replan_engine.trigger_replan(
        incidents=incidents,
        resources=resources,
        current_allocations=prev_allocs,
        reason="AMB-01 failed"
    )

    # AMB-02 should be assigned as replacement
    assert "AMB-02" in new_allocs["INC-001"]
    assert "AMB-01" not in new_allocs["INC-001"]
    assert plan.total_allocated_resources == 1
