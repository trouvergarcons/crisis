from typing import TypedDict, List, Dict, Any, Optional
from backend.app.models.incident import Incident
from backend.app.models.resource import Resource
from backend.app.models.response import ResponsePlan, AllocationChange
from backend.app.models.assessment import IncidentAssessmentOutput


class CrisisState(TypedDict, total=False):
    # Core entities
    incidents: Dict[str, Dict[str, Any]]
    resources: Dict[str, Dict[str, Any]]

    # Current processing context
    current_incident_id: Optional[str]
    trigger_type: str  # "new_incident", "replan", "resource_failure", "incident_resolved"

    # Node execution results
    assessments: Dict[str, Dict[str, Any]]
    priorities: Dict[str, Dict[str, Any]]
    resource_requirements: Dict[str, Dict[str, int]]
    allocations: Dict[str, List[str]]  # incident_id -> list of resource_ids
    previous_allocations: Dict[str, List[str]]  # Before state

    # Response and tracking
    response_plan: Optional[Dict[str, Any]]
    changes: List[Dict[str, Any]]
    alerts: List[str]
    conflicts: List[str]
    human_approval_required: bool
    approval_reasons: List[str]
    approval_status: str

    # Replanning state
    replanning_triggered: bool
    replanning_reason: Optional[str]

    # Meta
    execution_status: str
    timeline: List[Dict[str, Any]]
    timestamps: Dict[str, str]
    error: Optional[str]
