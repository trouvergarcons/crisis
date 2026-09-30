from typing import Dict, List, Any, Optional
from backend.app.services.coordination_service import coordination_service
from backend.app.models.incident import IncidentCreate


class IncidentService:
    def list_incidents(self) -> List[Dict[str, Any]]:
        return list(coordination_service.incidents.values())

    def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        return coordination_service.incidents.get(incident_id)

    def create_incident(self, data: IncidentCreate) -> Dict[str, Any]:
        return coordination_service.create_incident(data)

    def assess_incident(self, incident_id: str) -> Dict[str, Any]:
        if incident_id not in coordination_service.incidents:
            raise KeyError(f"Incident {incident_id} not found.")
        return coordination_service.run_graph(
            trigger_type="assess",
            current_incident_id=incident_id,
            trigger_reason=f"Manual assessment re-run for {incident_id}"
        )

    def resolve_incident(self, incident_id: str) -> Dict[str, Any]:
        return coordination_service.resolve_incident(incident_id)


incident_service = IncidentService()
