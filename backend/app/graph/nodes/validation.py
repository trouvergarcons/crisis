from typing import Dict
from backend.app.graph.state import CrisisState
from backend.app.engines.allocation_engine import allocation_engine


def resource_requirement_validation_node(state: CrisisState) -> CrisisState:
    """
    Node 3: Resource Requirement Validation
    Sanitizes requested resources, validates supported types and non-zero counts.
    """
    incidents = state.get("incidents", {})
    validated_requirements: Dict[str, Dict[str, int]] = {}
    alerts = list(state.get("alerts", []))

    for inc_id, inc in incidents.items():
        raw_reqs = inc.get("required_resources", {})
        cleaned_reqs, warnings = allocation_engine.validate_requirements(raw_reqs)
        validated_requirements[inc_id] = cleaned_reqs
        inc["required_resources"] = cleaned_reqs
        for w in warnings:
            alerts.append(f"[{inc.get('title', inc_id)}] {w}")

    return {
        **state,
        "incidents": incidents,
        "resource_requirements": validated_requirements,
        "alerts": alerts
    }
