from enum import Enum
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class ResourceType(str, Enum):
    AMBULANCE = "ambulance"
    RESCUE_TEAM = "rescue_team"
    MEDICAL_UNIT = "medical_unit"
    SHELTER = "shelter"
    FIRE_UNIT = "fire_unit"
    POLICE_UNIT = "police_unit"


class ResourceStatus(str, Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    EN_ROUTE = "en_route"
    BUSY = "busy"
    UNAVAILABLE = "unavailable"


class Resource(BaseModel):
    resource_id: str
    resource_type: ResourceType
    name: str
    status: ResourceStatus = ResourceStatus.AVAILABLE
    location: str
    latitude: float = 0.0
    longitude: float = 0.0
    availability: bool = True
    capacity: Optional[int] = Field(None, description="Capacity for shelters or units")
    assigned_incident_id: Optional[str] = None
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
