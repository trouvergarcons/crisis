from datetime import datetime, timezone
from backend.app.graph.state import CrisisState
from backend.app.engines.allocation_engine import allocation_engine
from backend.app.models.resource import ResourceStatus


def resource_allocation_node(state: CrisisState) -> CrisisState:
    """
    Node 4: Resource Allocation Engine
    Executes deterministic allocation and reallocation based on incident priority,
    distance, and availability. Tracks before/after differences.
    """
    incidents = state.get("incidents", {})
    resources = state.get("resources", {})
    existing_allocations = state.get("allocations", {})
    timeline = list(state.get("timeline", []))
    alerts = list(state.get("alerts", []))
    trigger_reason = state.get("replanning_reason")

    # Snapshot existing allocations as previous_allocations
    previous_allocations = {
        inc_id: list(r_ids) for inc_id, r_ids in existing_allocations.items()
    }

    new_allocs, changes, conflicts, human_approval, approval_reasons = allocation_engine.allocate(
        incidents=incidents,
        resources=resources,
        existing_allocations=existing_allocations,
        trigger_reason=trigger_reason
    )

    # Sync resources status with new assignments
    for r_id, res in resources.items():
        res["assigned_incident_id"] = None
        res["status"] = ResourceStatus.AVAILABLE.value if res.get("availability", True) else ResourceStatus.UNAVAILABLE.value

    for inc_id, r_ids in new_allocs.items():
        if inc_id in incidents:
            incidents[inc_id]["allocated_resources"] = r_ids
            incidents[inc_id]["status"] = "responding" if r_ids else incidents[inc_id]["status"]
        for r_id in r_ids:
            if r_id in resources:
                resources[r_id]["assigned_incident_id"] = inc_id
                resources[r_id]["status"] = ResourceStatus.ASSIGNED.value

    # Update timeline
    now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
    if changes:
        for chg in changes:
            timeline.append({
                "timestamp": now_str,
                "type": "allocation_change",
                "message": f"Resource {chg.resource_name} reallocated from {chg.previous_incident_title or 'Reserve'} to {chg.new_incident_title}"
            })
    else:
        timeline.append({
            "timestamp": now_str,
            "type": "allocation",
            "message": f"Allocations calculated across {len(new_allocs)} active incidents."
        })

    # Record any conflicts in alerts
    for conf in conflicts:
        alerts.append(f"Allocation Conflict: {conf}")

    return {
        **state,
        "incidents": incidents,
        "resources": resources,
        "allocations": new_allocs,
        "previous_allocations": previous_allocations,
        "changes": [c.model_dump() for c in changes],
        "conflicts": conflicts,
        "alerts": alerts,
        "human_approval_required": state.get("human_approval_required", False) or human_approval,
        "approval_reasons": list(set(list(state.get("approval_reasons", [])) + approval_reasons)),
        "timeline": timeline
    }
