import math
from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime, timezone

from backend.app.models.resource import Resource, ResourceStatus, ResourceType
from backend.app.models.incident import Incident, IncidentPriorityLevel
from backend.app.models.response import AllocationChange, IncidentActionPlan, ResponsePlan


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in kilometers."""
    if lat1 == 0.0 and lon1 == 0.0 and lat2 == 0.0 and lon2 == 0.0:
        return 0.0
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


class AllocationEngine:
    """
    Deterministic multi-incident emergency resource allocator.
    Prioritizes high-severity life-safety incidents, optimizes proximity,
    resolves resource contention, and tracks every reallocation change.
    """

    SUPPORTED_RESOURCES = {
        ResourceType.AMBULANCE.value,
        ResourceType.RESCUE_TEAM.value,
        ResourceType.MEDICAL_UNIT.value,
        ResourceType.SHELTER.value,
        ResourceType.FIRE_UNIT.value,
        ResourceType.POLICE_UNIT.value,
    }

    def validate_requirements(self, requirements: Dict[str, int]) -> Tuple[Dict[str, int], List[str]]:
        """Validates requested resource categories and counts."""
        validated: Dict[str, int] = {}
        warnings: List[str] = []

        for r_type, count in requirements.items():
            normalized_type = str(r_type).lower().strip()
            if normalized_type not in self.SUPPORTED_RESOURCES:
                warnings.append(f"Ignored unsupported resource type: '{r_type}'")
                continue
            if count <= 0:
                warnings.append(f"Invalid quantity {count} for '{r_type}', skipped.")
                continue
            validated[normalized_type] = int(count)

        return validated, warnings

    def allocate(
        self,
        incidents: Dict[str, Dict[str, Any]],
        resources: Dict[str, Dict[str, Any]],
        existing_allocations: Optional[Dict[str, List[str]]] = None,
        trigger_reason: Optional[str] = None
    ) -> Tuple[Dict[str, List[str]], List[AllocationChange], List[str], bool, List[str]]:
        """
        Executes deterministic allocation algorithm:
        1. Sort active incidents by priority_score descending.
        2. Fulfill requirements using available resources first (proximity-ranked).
        3. If unavailable, permit preemption from strictly lower-priority incidents.
        4. Record every change with explicit justification.
        5. Detect uncovered deficits and evaluate if Human Approval is required.
        """
        # Copy input state to prevent direct mutation during planning
        res_pool: Dict[str, Dict[str, Any]] = {r_id: dict(r) for r_id, r in resources.items()}
        current_allocs: Dict[str, List[str]] = (
            {inc_id: list(r_list) for inc_id, r_list in existing_allocations.items()}
            if existing_allocations
            else {inc_id: [] for inc_id in incidents.keys()}
        )

        # Map each resource to its current incident if assigned
        res_assignment_map: Dict[str, str] = {}
        for inc_id, r_ids in current_allocs.items():
            for r_id in r_ids:
                res_assignment_map[r_id] = inc_id

        # Filter active incidents (ignore resolved)
        active_incidents = [
            inc for inc in incidents.values()
            if inc.get("status") not in ["resolved", "contained"]
        ]

        # Sort incidents strictly by priority score descending
        sorted_incidents = sorted(
            active_incidents,
            key=lambda x: (x.get("priority_score", 0.0), x.get("severity", 0), x.get("urgency", 0)),
            reverse=True
        )

        new_allocations: Dict[str, List[str]] = {inc["incident_id"]: [] for inc in active_incidents}
        changes: List[AllocationChange] = []
        conflicts: List[str] = []
        human_approval_required = False
        approval_reasons: List[str] = []

        # Track which resources have been claimed in this planning run
        assigned_in_run: Dict[str, str] = {}  # resource_id -> incident_id

        # Phase 1: Keep already assigned resources for higher-priority incidents if still needed
        for inc in sorted_incidents:
            inc_id = inc["incident_id"]
            inc_title = inc.get("title", inc_id)
            required = dict(inc.get("required_resources", {}))

            # Check existing assignments for this incident
            prev_res_ids = current_allocs.get(inc_id, [])
            for r_id in prev_res_ids:
                if r_id in res_pool:
                    r_type = res_pool[r_id].get("resource_type")
                    r_status = res_pool[r_id].get("status")
                    # If unit is still operational and required
                    if r_status != ResourceStatus.UNAVAILABLE.value and required.get(r_type, 0) > 0:
                        new_allocations[inc_id].append(r_id)
                        assigned_in_run[r_id] = inc_id
                        required[r_type] -= 1

        # Phase 2: Fulfill unsatisfied needs in order of incident priority
        for inc in sorted_incidents:
            inc_id = inc["incident_id"]
            inc_title = inc.get("title", inc_id)
            inc_prio = inc.get("priority_score", 0.0)
            inc_lat = inc.get("latitude", 0.0)
            inc_lon = inc.get("longitude", 0.0)
            required = dict(inc.get("required_resources", {}))

            # Deduct already retained units
            for r_id in new_allocations[inc_id]:
                r_type = res_pool[r_id].get("resource_type")
                if r_type in required and required[r_type] > 0:
                    required[r_type] -= 1

            for req_type, count_needed in required.items():
                if count_needed <= 0:
                    continue

                for _ in range(count_needed):
                    # 1. Search for available and unassigned resources of this type
                    candidate_available = [
                        r_id for r_id, r in res_pool.items()
                        if r.get("resource_type") == req_type
                        and r.get("status") != ResourceStatus.UNAVAILABLE.value
                        and r_id not in assigned_in_run
                        and r_id not in res_assignment_map
                    ]

                    # Rank available candidates by proximity
                    if candidate_available:
                        candidate_available.sort(
                            key=lambda rid: calculate_distance(
                                inc_lat, inc_lon,
                                res_pool[rid].get("latitude", 0.0),
                                res_pool[rid].get("longitude", 0.0)
                            )
                        )
                        chosen_id = candidate_available[0]
                        new_allocations[inc_id].append(chosen_id)
                        assigned_in_run[chosen_id] = inc_id

                        # Record allocation if it's new
                        if chosen_id not in current_allocs.get(inc_id, []):
                            changes.append(
                                AllocationChange(
                                    resource_id=chosen_id,
                                    resource_name=res_pool[chosen_id].get("name", chosen_id),
                                    resource_type=req_type,
                                    previous_incident_id=None,
                                    previous_incident_title="Unassigned Reserve",
                                    new_incident_id=inc_id,
                                    new_incident_title=inc_title,
                                    reason=f"Assigned to {inc_title} (Priority: {inc_prio})"
                                )
                            )
                        continue

                    # 2. If no free unit, check if preemption from a strictly lower-priority incident is justified
                    candidate_preempt = []
                    for other_inc in sorted_incidents:
                        other_id = other_inc["incident_id"]
                        other_prio = other_inc.get("priority_score", 0.0)

                        # Must have strictly lower priority (minimum delta of 5 points)
                        if other_prio + 5.0 <= inc_prio and other_id != inc_id:
                            for r_id in list(new_allocations.get(other_id, [])):
                                if res_pool[r_id].get("resource_type") == req_type:
                                    dist = calculate_distance(
                                        inc_lat, inc_lon,
                                        res_pool[r_id].get("latitude", 0.0),
                                        res_pool[r_id].get("longitude", 0.0)
                                    )
                                    candidate_preempt.append((other_prio, dist, r_id, other_id))

                    if candidate_preempt:
                        # Sort by lowest priority first, then proximity
                        candidate_preempt.sort(key=lambda item: (item[0], item[1]))
                        victim_prio, _, victim_res_id, victim_inc_id = candidate_preempt[0]
                        victim_title = incidents[victim_inc_id].get("title", victim_inc_id)

                        # Reallocate resource
                        new_allocations[victim_inc_id].remove(victim_res_id)
                        new_allocations[inc_id].append(victim_res_id)
                        assigned_in_run[victim_res_id] = inc_id

                        # Record explicit reallocation change
                        change = AllocationChange(
                            resource_id=victim_res_id,
                            resource_name=res_pool[victim_res_id].get("name", victim_res_id),
                            resource_type=req_type,
                            previous_incident_id=victim_inc_id,
                            previous_incident_title=victim_title,
                            new_incident_id=inc_id,
                            new_incident_title=inc_title,
                            reason=f"Priority reallocation: {inc_title} ({inc_prio}) > {victim_title} ({victim_prio})"
                        )
                        changes.append(change)

                        # Check human approval requirement
                        human_approval_required = True
                        approval_reasons.append(
                            f"Reallocated {res_pool[victim_res_id].get('name', victim_res_id)} from {victim_title} to higher-priority {inc_title}."
                        )
                        continue

                    # 3. If neither available nor preemptible, deficit remains
                    conflicts.append(
                        f"Resource deficit at {inc_title}: Unable to fulfill required '{req_type}'."
                    )
                    if inc.get("priority_level") in [IncidentPriorityLevel.CRITICAL.value, "CRITICAL"]:
                        human_approval_required = True
                        approval_reasons.append(
                            f"Critical incident {inc_title} has an uncovered requirement for {req_type}."
                        )

        # Flag general approval if high number of shifts occurred
        if len(changes) >= 3 and not human_approval_required:
            human_approval_required = True
            approval_reasons.append(f"Multi-resource reallocation plan involves {len(changes)} tactical shifts.")

        return new_allocations, changes, conflicts, human_approval_required, approval_reasons


allocation_engine = AllocationEngine()
