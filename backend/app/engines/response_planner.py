import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

from backend.app.models.response import ResponsePlan, IncidentActionPlan, AllocationChange
from backend.app.services.llm_service import llm_service


class ResponsePlanner:
    """
    Synthesizes tactical allocation results into a coherent, actionable emergency response plan.
    Enriches assignments with human-readable rationale while keeping allocations strictly deterministic.
    """

    def generate_plan(
        self,
        incidents: Dict[str, Dict[str, Any]],
        resources: Dict[str, Dict[str, Any]],
        allocations: Dict[str, List[str]],
        changes: List[AllocationChange],
        human_approval_required: bool,
        approval_reasons: List[str],
        trigger_reason: Optional[str] = None,
        replanning_triggered: bool = False
    ) -> ResponsePlan:
        incident_plans: List[IncidentActionPlan] = []
        total_allocated = 0
        total_uncovered = 0

        for inc_id, inc in incidents.items():
            if inc.get("status") in ["resolved", "contained"]:
                continue

            assigned_ids = allocations.get(inc_id, [])
            total_allocated += len(assigned_ids)

            # Build resource details and tactical actions
            details = []
            actions = []
            assigned_types_count: Dict[str, int] = {}

            for r_id in assigned_ids:
                res = resources.get(r_id, {})
                r_type = res.get("resource_type", "unit")
                r_name = res.get("name", r_id)
                r_loc = res.get("location", "Base")
                assigned_types_count[r_type] = assigned_types_count.get(r_type, 0) + 1

                details.append({
                    "resource_id": r_id,
                    "name": r_name,
                    "type": r_type,
                    "location": r_loc
                })
                actions.append(f"Simulate proposed assignment of {r_name} ({r_type}) to {inc.get('title')}")

            # Compute deficit
            uncovered: Dict[str, int] = {}
            for req_type, req_qty in inc.get("required_resources", {}).items():
                satisfied = assigned_types_count.get(req_type, 0)
                if satisfied < req_qty:
                    deficit = req_qty - satisfied
                    uncovered[req_type] = deficit
                    total_uncovered += deficit
                    actions.append(f"⚠️ DEFICIT: {deficit} {req_type} required but currently unavailable in field.")

            prio_level = inc.get("priority_level", "MEDIUM")
            if isinstance(prio_level, dict):
                prio_level = prio_level.get("value", "MEDIUM")

            rationale = llm_service.generate_response_rationale(
                incident_title=inc.get("title", inc_id),
                priority_level=str(prio_level),
                allocated_resources=[res.get("name", rid) for rid in assigned_ids],
                uncovered_needs=uncovered
            )

            incident_plans.append(
                IncidentActionPlan(
                    incident_id=inc_id,
                    incident_title=inc.get("title", inc_id),
                    priority_level=str(prio_level),
                    priority_score=float(inc.get("priority_score", 0.0)),
                    actions=actions,
                    allocated_resource_ids=assigned_ids,
                    allocated_resource_details=details,
                    uncovered_needs=uncovered,
                    rationale=rationale
                )
            )

        # Sort incident plans by priority score descending
        incident_plans.sort(key=lambda p: p.priority_score, reverse=True)

        # Executive summary
        critical_count = sum(1 for p in incident_plans if p.priority_level == "CRITICAL")
        executive_summary = llm_service.generate_executive_summary(
            total_incidents=len(incident_plans),
            critical_count=critical_count,
            replan_occurred=replanning_triggered,
            reasons=approval_reasons if approval_reasons else ([trigger_reason] if trigger_reason else [])
        )

        plan = ResponsePlan(
            plan_id=f"PLAN-{uuid.uuid4().hex[:8].upper()}",
            generated_at=datetime.now(timezone.utc),
            incident_plans=incident_plans,
            total_allocated_resources=total_allocated,
            total_uncovered_needs=total_uncovered,
            human_approval_required=human_approval_required,
            approval_reasons=approval_reasons,
            approval_status="proposed" if human_approval_required else "active",
            replanning_triggered=replanning_triggered,
            trigger_reason=trigger_reason,
            changes=changes,
            executive_summary=executive_summary
        )

        return plan


response_planner = ResponsePlanner()
