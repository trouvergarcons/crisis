from typing import Dict, Any
from backend.app.graph.state import CrisisState
from backend.app.engines.replanning_engine import replanning_engine


def replanning_node(state: CrisisState) -> CrisisState:
    """
    Dedicated replanning node that re-evaluates all assignments against the updated resource/incident state.
    """
    incidents = state.get("incidents", {})
    resources = state.get("resources", {})
    current_allocs = state.get("allocations", {})
    reason = state.get("replanning_reason", "Dynamic replanning triggered")

    new_allocs, plan, changes, human_approval, approval_reasons = replanning_engine.trigger_replan(
        incidents=incidents,
        resources=resources,
        current_allocations=current_allocs,
        reason=reason
    )

    return {
        **state,
        "allocations": new_allocs,
        "previous_allocations": current_allocs,
        "response_plan": plan.model_dump(),
        "changes": [c.model_dump() for c in changes],
        "human_approval_required": human_approval,
        "approval_reasons": approval_reasons,
        "replanning_triggered": True,
        "replanning_reason": reason
    }
