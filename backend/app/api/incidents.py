from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from backend.app.models.incident import IncidentCreate, Incident
from backend.app.services.incident_service import incident_service

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.get("", response_model=List[Dict[str, Any]])
def get_incidents():
    """Retrieve all emergency incidents."""
    return incident_service.list_incidents()


@router.post("", response_model=Dict[str, Any], status_code=201)
def create_incident(payload: IncidentCreate):
    """Report a new incident and trigger LangGraph assessment and allocation."""
    try:
        return incident_service.create_incident(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{incident_id}", response_model=Dict[str, Any])
def get_incident(incident_id: str):
    """Retrieve details for a specific incident."""
    inc = incident_service.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
    return inc


@router.post("/{incident_id}/assess", response_model=Dict[str, Any])
def assess_incident(incident_id: str):
    """Re-trigger assessment agent and priority calculation for an incident."""
    try:
        res = incident_service.assess_incident(incident_id)
        return {
            "status": "success",
            "incident": incident_service.get_incident(incident_id),
            "assessment": res.get("assessments", {}).get(incident_id)
        }
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{incident_id}/resolve", response_model=Dict[str, Any])
def resolve_incident(incident_id: str):
    """Resolve an incident, releasing assigned resources back to the pool."""
    try:
        incident_service.resolve_incident(incident_id)
        return {
            "status": "success",
            "message": f"Incident {incident_id} marked resolved.",
            "incident": incident_service.get_incident(incident_id)
        }
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
