from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from backend.app.services.resource_service import resource_service

router = APIRouter(prefix="/api/resources", tags=["Resources"])


@router.get("", response_model=List[Dict[str, Any]])
def get_resources():
    """Retrieve all emergency response resources."""
    return resource_service.list_resources()


@router.get("/{resource_id}", response_model=Dict[str, Any])
def get_resource(resource_id: str):
    """Retrieve details for a specific resource."""
    res = resource_service.get_resource(resource_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found.")
    return res


@router.post("/{resource_id}/unavailable", response_model=Dict[str, Any])
def mark_resource_unavailable(resource_id: str):
    """Mark a resource as unavailable (breakdown/offline) and trigger dynamic replanning."""
    try:
        resource_service.mark_unavailable(resource_id)
        return {
            "status": "success",
            "message": f"Resource {resource_id} set to UNAVAILABLE. Replanning triggered.",
            "resource": resource_service.get_resource(resource_id)
        }
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
