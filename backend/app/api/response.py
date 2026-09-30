from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from backend.app.services.coordination_service import coordination_service
from backend.app.models.response import PlanApprovalRequest

router = APIRouter(prefix="/api/response", tags=["Response Plan"])


class ReplanRequest(BaseModel):
    reason: Optional[str] = Field("Manual replanning requested by command staff", description="Reason for replanning")


@router.get("/plan", response_model=Optional[Dict[str, Any]])
def get_current_plan():
    """Retrieve the current coordinated emergency response plan."""
    return coordination_service.current_plan


@router.post("/plan", response_model=Dict[str, Any])
def generate_or_refresh_plan():
    """Trigger a refresh of the response plan across current incidents and resources."""
    try:
        coordination_service.run_graph(
            trigger_type="plan_refresh",
            trigger_reason="Command center requested response plan refresh"
        )
        return coordination_service.current_plan or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/replan", response_model=Dict[str, Any])
def trigger_replan(payload: Optional[ReplanRequest] = None):
    """Trigger dynamic replanning with re-prioritization and reallocation."""
    reason = payload.reason if payload and payload.reason else "Manual command replan triggered"
    try:
        result = coordination_service.run_graph(
            trigger_type="replan",
            trigger_reason=reason
        )
        return {
            "status": "success",
            "message": "Dynamic replanning executed successfully.",
            "response_plan": coordination_service.current_plan,
            "replanning_event": coordination_service.last_replan_event,
            "changes": result.get("changes", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/plan/approve", response_model=Dict[str, Any])
def approve_or_reject_plan(payload: PlanApprovalRequest):
    """Human Command Approval endpoint: approve, reject, or mark plan under review."""
    try:
        return coordination_service.handle_human_approval(
            action=payload.action,
            reviewer_notes=payload.reviewer_notes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/changes", response_model=List[Dict[str, Any]])
def get_allocation_changes():
    """Retrieve history of resource reallocations and tactical shifts."""
    return coordination_service.changes
