from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class AllocationChange(BaseModel):
    resource_id: str
    resource_name: str
    resource_type: str
    previous_incident_id: Optional[str] = None
    previous_incident_title: Optional[str] = None
    new_incident_id: Optional[str] = None
    new_incident_title: Optional[str] = None
    reason: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class IncidentActionPlan(BaseModel):
    incident_id: str
    incident_title: str
    priority_level: str
    priority_score: float
    actions: List[str] = Field(default_factory=list)
    allocated_resource_ids: List[str] = Field(default_factory=list)
    allocated_resource_details: List[Dict[str, Any]] = Field(default_factory=list)
    uncovered_needs: Dict[str, int] = Field(default_factory=dict)
    rationale: str = ""


class ResponsePlan(BaseModel):
    plan_id: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    incident_plans: List[IncidentActionPlan] = Field(default_factory=list)
    total_allocated_resources: int = 0
    total_uncovered_needs: int = 0
    human_approval_required: bool = False
    approval_reasons: List[str] = Field(default_factory=list)
    approval_status: str = "proposed"  # "proposed", "approved", "rejected"
    replanning_triggered: bool = False
    trigger_reason: Optional[str] = None
    changes: List[AllocationChange] = Field(default_factory=list)
    executive_summary: str = ""


class PlanApprovalRequest(BaseModel):
    action: str = Field(..., description="'approve', 'reject', or 'review'")
    reviewer_notes: Optional[str] = Field(None, description="Optional notes from command staff")
