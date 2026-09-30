from enum import Enum
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class IncidentType(str, Enum):
    BUILDING_COLLAPSE = "building_collapse"
    ROAD_ACCIDENT = "road_accident"
    FLOOD = "flood"
    FIRE = "fire"
    EARTHQUAKE = "earthquake"
    CHEMICAL_EXPLOSION = "chemical_explosion"
    MEDICAL_EMERGENCY = "medical_emergency"
    LANDSLIDE = "landslide"
    OTHER = "other"


class IncidentStatus(str, Enum):
    REPORTED = "reported"
    ASSESSED = "assessed"
    RESPONDING = "responding"
    CONTAINED = "contained"
    RESOLVED = "resolved"


class IncidentPriorityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class IncidentCreate(BaseModel):
    title: str = Field(..., description="Short title of the emergency")
    description: str = Field(..., description="Detailed description of the incident")
    location: str = Field(..., description="Human readable location or address")
    latitude: Optional[float] = Field(None, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, description="Longitude coordinate")
    incident_type: Optional[IncidentType] = Field(None, description="Incident type if known")
    severity: Optional[int] = Field(None, ge=1, le=10, description="Severity 1-10 if pre-assessed")
    urgency: Optional[int] = Field(None, ge=1, le=10, description="Urgency 1-10 if pre-assessed")
    people_affected: int = Field(0, ge=0, description="Estimated number of people affected")
    estimated_casualties: int = Field(0, ge=0, description="Estimated casualties or injuries")
    required_resources: Optional[Dict[str, int]] = Field(default_factory=dict, description="Required resources if known")


class Incident(BaseModel):
    incident_id: str
    incident_type: IncidentType = IncidentType.OTHER
    title: str
    description: str
    location: str
    latitude: float = 0.0
    longitude: float = 0.0
    severity: int = Field(1, ge=1, le=10)
    urgency: int = Field(1, ge=1, le=10)
    people_affected: int = 0
    estimated_casualties: int = 0
    required_resources: Dict[str, int] = Field(default_factory=dict)
    allocated_resources: List[str] = Field(default_factory=list)
    status: IncidentStatus = IncidentStatus.REPORTED
    priority_score: float = 0.0
    priority_level: IncidentPriorityLevel = IncidentPriorityLevel.LOW
    priority_factors: Dict[str, Any] = Field(default_factory=dict)
    assessment_explanation: Optional[str] = None
    response_plan_summary: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
