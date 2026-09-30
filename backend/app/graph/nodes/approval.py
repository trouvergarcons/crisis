from datetime import datetime, timezone
from backend.app.graph.state import CrisisState


def human_approval_node(state: CrisisState) -> CrisisState:
    """
    Node 6: Human Approval / Decision Check
    Verifies if critical thresholds or preemption occurred that necessitate human command signoff.
    """
    human_approval_required = state.get("human_approval_required", False)
    approval_reasons = list(state.get("approval_reasons", []))
    alerts = list(state.get("alerts", []))
    timeline = list(state.get("timeline", []))

    now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")

    if human_approval_required:
        approval_status = "proposed"
        alert_msg = f"HUMAN APPROVAL REQUIRED: {'; '.join(approval_reasons[:2])}"
        if alert_msg not in alerts:
            alerts.insert(0, alert_msg)
        timeline.append({
            "timestamp": now_str,
            "type": "human_approval",
            "message": f"Action Plan flagged for Human Command Approval ({len(approval_reasons)} triggers)."
        })
    else:
        approval_status = "active"
        timeline.append({
            "timestamp": now_str,
            "type": "human_approval",
            "message": "Plan validated: No disruptive shifts detected, auto-approved for simulation."
        })

    # Sync back into response plan if present
    plan = state.get("response_plan")
    if plan:
        plan["human_approval_required"] = human_approval_required
        plan["approval_reasons"] = approval_reasons
        plan["approval_status"] = approval_status

    return {
        **state,
        "human_approval_required": human_approval_required,
        "approval_reasons": approval_reasons,
        "approval_status": approval_status,
        "response_plan": plan,
        "alerts": alerts,
        "timeline": timeline,
        "execution_status": "completed"
    }
