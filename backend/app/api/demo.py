from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from backend.app.services.coordination_service import coordination_service

router = APIRouter(prefix="/api/demo", tags=["Demo Scenarios"])


@router.post("/reset", response_model=Dict[str, Any])
def reset_simulation():
    """Reset the entire simulated environment to a clean initial state."""
    try:
        coordination_service.reset()
        return {
            "status": "success",
            "message": "Simulated emergency environment reset successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/load-scenario", response_model=Dict[str, Any])
def load_standard_scenario():
    """Load the standard multi-incident emergency response scenario (4 active incidents, 19 resources)."""
    try:
        res = coordination_service.load_scenario()
        return {
            "status": "success",
            "message": "Loaded 4 initial incidents and 19 resources. Initial response plan generated.",
            "incidents_count": len(coordination_service.incidents),
            "resources_count": len(coordination_service.resources),
            "response_plan": coordination_service.current_plan
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/new-critical-incident", response_model=Dict[str, Any])
def simulate_new_critical_incident():
    """
    Key Hackathon Demo Trigger:
    Simulates the sudden arrival of a catastrophic Chemical Plant Explosion (Severity 10, Urgency 10, 50 people).
    Triggers dynamic replanning, reallocates priority resources, records before/after differences,
    and flags Human Approval requirement.
    """
    try:
        res = coordination_service.trigger_chemical_explosion_demo()
        return {
            "status": "success",
            "message": "Critical chemical explosion reported. Dynamic replanning and resource preemption executed.",
            "replanning_event": coordination_service.last_replan_event,
            "response_plan": coordination_service.current_plan,
            "human_approval_required": coordination_service.current_plan.get("human_approval_required", False) if coordination_service.current_plan else False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resource-failure", response_model=Dict[str, Any])
def simulate_resource_failure():
    """
    Key Hackathon Demo Trigger:
    Simulates a mechanical failure of an actively assigned resource (e.g. AMB-01),
    taking it offline and triggering dynamic replanning to replace lost capacity.
    """
    try:
        res = coordination_service.trigger_resource_failure_demo()
        return {
            "status": "success",
            "message": "Resource failure simulated. Unit taken offline and replacement replanning executed.",
            "replanning_event": coordination_service.last_replan_event,
            "response_plan": coordination_service.current_plan
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
