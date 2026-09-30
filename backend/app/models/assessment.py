from typing import Dict, Optional
from pydantic import BaseModel, Field


class IncidentAssessmentOutput(BaseModel):
    incident_type: str = Field(..., description="Categorized incident type")
    severity: int = Field(..., ge=1, le=10, description="Severity score 1 (minimal) to 10 (catastrophic)")
    urgency: int = Field(..., ge=1, le=10, description="Urgency score 1 (low) to 10 (immediate life threat)")
    people_at_risk: int = Field(..., ge=0, description="Estimated number of civilians in direct danger")
    estimated_casualties: int = Field(default=0, ge=0, description="Estimated immediate casualties/injuries")
    required_resources: Dict[str, int] = Field(..., description="Resource categories and quantities required")
    hazard_summary: str = Field(..., description="Concise analysis of primary hazards and situational urgency")
    confidence_score: float = Field(default=0.9, ge=0.0, le=1.0, description="Confidence in assessment")
