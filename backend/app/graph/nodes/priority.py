from datetime import datetime, timezone
from backend.app.graph.state import CrisisState
from backend.app.engines.priority_engine import priority_engine


def priority_evaluation_node(state: CrisisState) -> CrisisState:
    """
    Node 2: Deterministic Priority Engine
    Calculates transparent priority score and assigns priority level
    (CRITICAL, HIGH, MEDIUM, LOW) across all active incidents.
    """
    incidents = state.get("incidents", {})
    priorities = state.get("priorities", {})
    timeline = list(state.get("timeline", []))

    for inc_id, inc in incidents.items():
        if inc.get("status") in ["resolved", "contained"]:
            continue

        score, level, factors = priority_engine.calculate_priority(
            severity=inc.get("severity", 5),
            urgency=inc.get("urgency", 5),
            people_affected=inc.get("people_affected", 0),
            estimated_casualties=inc.get("estimated_casualties", 0),
            incident_type=inc.get("incident_type", "other")
        )

        priorities[inc_id] = {
            "priority_score": score,
            "priority_level": level.value,
            "factors": factors
        }

        inc["priority_score"] = score
        inc["priority_level"] = level.value
        inc["priority_factors"] = factors
        inc["updated_at"] = datetime.now(timezone.utc).isoformat()

    now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
    current_id = state.get("current_incident_id")
    if current_id and current_id in priorities:
        p_info = priorities[current_id]
        timeline.append({
            "timestamp": now_str,
            "type": "priority",
            "message": f"Priority calculated for {incidents[current_id].get('title', current_id)}: {p_info['priority_score']} [{p_info['priority_level']}]"
        })

    return {
        **state,
        "incidents": incidents,
        "priorities": priorities,
        "timeline": timeline
    }
