from typing import Dict, List, Any, Optional
from backend.app.services.coordination_service import coordination_service


class ResourceService:
    def list_resources(self) -> List[Dict[str, Any]]:
        return list(coordination_service.resources.values())

    def get_resource(self, resource_id: str) -> Optional[Dict[str, Any]]:
        return coordination_service.resources.get(resource_id)

    def mark_unavailable(self, resource_id: str) -> Dict[str, Any]:
        return coordination_service.mark_resource_unavailable(resource_id)


resource_service = ResourceService()
