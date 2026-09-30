from fastapi import APIRouter
from typing import Dict, Any
from backend.app.services.coordination_service import coordination_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=Dict[str, Any])
def get_dashboard_data():
    """Retrieve full dashboard situational summary, active cards, alerts, and replanning data."""
    summary = coordination_service.get_dashboard_summary()
    return {
        "metrics": summary,
        "incidents": list(coordination_service.incidents.values()),
        "resources": list(coordination_service.resources.values()),
        "response_plan": coordination_service.current_plan,
        "last_replan_event": coordination_service.last_replan_event,
        "alerts": summary["alerts"],
        "timeline": summary["timeline"]
    }
