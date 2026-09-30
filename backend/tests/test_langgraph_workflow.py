import pytest
from backend.app.graph.graph import crisis_graph
from backend.app.graph.state import CrisisState
from backend.app.data.demo_data import get_initial_resources


def test_langgraph_workflow_execution():
    """
    Tests end-to-end execution of the LangGraph StateGraph:
    START -> Assessment -> Priority -> Validation -> Allocation -> Planner -> Approval -> END
    """
    initial_resources = get_initial_resources()

    state_input: CrisisState = {
        "incidents": {
            "INC-TEST": {
                "incident_id": "INC-TEST",
                "title": "Severe Gas Explosion",
                "description": "Natural gas pipeline exploded destroying 2 residences. Severe blast radius.",
                "location": "Elm Street",
                "latitude": 37.77,
                "longitude": -122.42,
                "people_affected": 25,
                "severity": 9,
                "urgency": 9,
                "required_resources": {"ambulance": 2, "fire_unit": 1},
                "status": "reported"
            }
        },
        "resources": initial_resources,
        "current_incident_id": "INC-TEST",
        "trigger_type": "new_incident",
        "assessments": {},
        "priorities": {},
        "resource_requirements": {},
        "allocations": {},
        "previous_allocations": {},
        "response_plan": None,
        "changes": [],
        "alerts": [],
        "conflicts": [],
        "human_approval_required": False,
        "approval_reasons": [],
        "approval_status": "proposed",
        "replanning_triggered": False,
        "replanning_reason": "New gas explosion reported",
        "execution_status": "started",
        "timeline": [],
        "timestamps": {}
    }

    output_state = crisis_graph.invoke(state_input)

    # Verifications across nodes:
    # 1. Assessment node executed
    assert "INC-TEST" in output_state["assessments"]
    assert output_state["assessments"]["INC-TEST"]["severity"] >= 8

    # 2. Priority node executed
    assert "INC-TEST" in output_state["priorities"]
    assert output_state["priorities"]["INC-TEST"]["priority_score"] >= 80.0

    # 3. Allocation node executed
    assert "INC-TEST" in output_state["allocations"]
    assert len(output_state["allocations"]["INC-TEST"]) > 0

    # 4. Planner node executed
    assert output_state["response_plan"] is not None
    assert output_state["response_plan"]["total_allocated_resources"] > 0

    # 5. Approval node executed
    assert output_state["execution_status"] == "completed"
    assert len(output_state["timeline"]) >= 3
