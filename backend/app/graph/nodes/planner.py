from datetime import datetime, timezone
from backend.app.graph.state import CrisisState
from backend.app.engines.response_planner import response_planner
from backend.app.models.response import AllocationChange


def response_planning_node(state: CrisisState) -> CrisisState:
    """
    Node 5: Response Planner
    Builds the comprehensive ResponsePlan object with detailed action items,
    deficit logs, and human-readable LLM rationale.
    """
    incidents = state.get("incidents", {})
    resources = state.get("resources", {})
    allocations = state.get("allocations", {})
    changes_raw = state.get("changes", [])
    changes = [AllocationChange(**c) if isinstance(c, dict) else c for c in changes_raw]
    human_approval = state.get("human_approval_required", False)
    approval_reasons = state.get("approval_reasons", [])
    trigger_reason = state.get("replanning_reason")
    replanning_triggered = state.get("replanning_triggered", False)
    timeline = list(state.get("timeline", []))

    plan = response_planner.generate_plan(
        incidents=incidents,
        resources=resources,
        allocations=allocations,
        changes=changes,
        human_approval_required=human_approval,
        approval_reasons=approval_reasons,
        trigger_reason=trigger_reason,
        replanning_triggered=replanning_triggered
    )

    # Attach response summary back to incidents
    for p in plan.incident_plans:
        if p.incident_id in incidents:
            incidents[p.incident_id]["response_plan_summary"] = p.rationale

    now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
    timeline.append({
        "timestamp": now_str,
        "type": "plan",
        "message": f"Response Plan {plan.plan_id} generated. Total assigned units: {plan.total_allocated_resources}, Deficit: {plan.total_uncovered_needs}"
    })

    return {
        **state,
        "incidents": incidents,
        "response_plan": plan.model_dump(),
        "timeline": timeline
    }
