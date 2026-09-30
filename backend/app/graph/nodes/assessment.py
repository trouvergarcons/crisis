from datetime import datetime, timezone
from typing import Dict, Any
from backend.app.graph.state import CrisisState
from backend.app.services.llm_service import llm_service
from backend.app.models.incident import IncidentStatus


def incident_assessment_node(state: CrisisState) -> CrisisState:
    """
    Node 1: Incident Assessment Agent
    Extracts structured assessment (severity, urgency, casualties, required resources)
    using LLM or fallback deterministic domain heuristics.
    """
    inc_id = state.get("current_incident_id")
    incidents = state.get("incidents", {})
    assessments = state.get("assessments", {})
    timeline = list(state.get("timeline", []))

    if inc_id and inc_id in incidents:
        inc = incidents[inc_id]
        assessment_res = llm_service.assess_incident(inc)
        
        # Save structured assessment
        assessments[inc_id] = assessment_res.model_dump()

        # Update incident data
        inc["incident_type"] = assessment_res.incident_type
        inc["severity"] = assessment_res.severity
        inc["urgency"] = assessment_res.urgency
        inc["people_affected"] = assessment_res.people_at_risk
        inc["estimated_casualties"] = assessment_res.estimated_casualties
        inc["required_resources"] = assessment_res.required_resources
        inc["assessment_explanation"] = assessment_res.hazard_summary
        inc["status"] = IncidentStatus.ASSESSED.value
        inc["updated_at"] = datetime.now(timezone.utc).isoformat()

        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
        timeline.append({
            "timestamp": now_str,
            "type": "assessment",
            "message": f"Assessment completed for {inc.get('title', inc_id)}: Severity {assessment_res.severity}/10, Urgency {assessment_res.urgency}/10"
        })

    # If no specific current incident, assess all unassessed active incidents
    else:
        for i_id, inc in incidents.items():
            if inc.get("status") == IncidentStatus.REPORTED.value:
                assessment_res = llm_service.assess_incident(inc)
                assessments[i_id] = assessment_res.model_dump()
                inc["incident_type"] = assessment_res.incident_type
                inc["severity"] = assessment_res.severity
                inc["urgency"] = assessment_res.urgency
                inc["people_affected"] = assessment_res.people_at_risk
                inc["estimated_casualties"] = assessment_res.estimated_casualties
                inc["required_resources"] = assessment_res.required_resources
                inc["assessment_explanation"] = assessment_res.hazard_summary
                inc["status"] = IncidentStatus.ASSESSED.value

    return {
        **state,
        "incidents": incidents,
        "assessments": assessments,
        "timeline": timeline
    }
