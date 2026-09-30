from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timezone

from backend.app.engines.allocation_engine import allocation_engine
from backend.app.engines.response_planner import response_planner
from backend.app.models.response import ResponsePlan, AllocationChange
from backend.app.models.resource import ResourceStatus


class ReplanningEngine:
    """
    Coordinates dynamic replanning across the emergency environment.
    Captures before-and-after states, triggers deterministic reallocations,
    and flags significant operational changes requiring Human Approval.
    """

    def trigger_replan(
        self,
        incidents: Dict[str, Dict[str, Any]],
        resources: Dict[str, Dict[str, Any]],
        current_allocations: Dict[str, List[str]],
        reason: str
    ) -> Tuple[Dict[str, List[str]], ResponsePlan, List[AllocationChange], bool, List[str]]:
        """
        Executes dynamic replanning workflow:
        1. Snapshots BEFORE allocations.
        2. Re-runs allocation engine with conflict resolution and priority ranking.
        3. Identifies before/after diffs and logs explicit changes.
        4. Generates updated response plan.
        5. Computes whether Human Approval is required.
        """
        before_state: Dict[str, List[str]] = {
            inc_id: list(r_ids) for inc_id, r_ids in current_allocations.items()
        }

        # Run allocation
        new_allocs, changes, conflicts, human_approval, approval_reasons = allocation_engine.allocate(
            incidents=incidents,
            resources=resources,
            existing_allocations=current_allocations,
            trigger_reason=reason
        )

        # Build response plan
        plan = response_planner.generate_plan(
            incidents=incidents,
            resources=resources,
            allocations=new_allocs,
            changes=changes,
            human_approval_required=human_approval,
            approval_reasons=approval_reasons,
            trigger_reason=reason,
            replanning_triggered=True
        )

        return new_allocs, plan, changes, human_approval, approval_reasons


replanning_engine = ReplanningEngine()
