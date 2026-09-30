import copy
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
import threading
import uuid

from backend.app.data.demo_data import (
    get_initial_resources,
    get_initial_incidents,
    get_chemical_explosion_incident,
)
from backend.app.graph.graph import crisis_graph
from backend.app.graph.state import CrisisState
from backend.app.models.incident import Incident, IncidentCreate, IncidentStatus, IncidentType
from backend.app.models.resource import Resource, ResourceStatus
from backend.app.models.response import ResponsePlan, AllocationChange
from backend.app.engines.priority_engine import priority_engine

logger = logging.getLogger(__name__)


class CrisisCoordinationService:
    """
    Central orchestration service managing incidents, resources, allocations,
    and LangGraph workflow execution with thread safety.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self.incidents: Dict[str, Dict[str, Any]] = {}
        self.resources: Dict[str, Dict[str, Any]] = {}
        self.allocations: Dict[str, List[str]] = {}
        self.previous_allocations: Dict[str, List[str]] = {}
        self.current_plan: Optional[Dict[str, Any]] = None
        self.timeline: List[Dict[str, Any]] = []
        self.alerts: List[str] = []
        self.changes: List[Dict[str, Any]] = []
        self.last_replan_event: Optional[Dict[str, Any]] = None
        self.load_scenario()

    def reset(self) -> None:
        """Resets all simulation state to a clean slate."""
        with self._lock:
            self.incidents = {}
            self.resources = get_initial_resources()
            self.allocations = {}
            self.previous_allocations = {}
            self.current_plan = None
            self.timeline = []
            self.alerts = []
            self.changes = []
            self.last_replan_event = None
            self._log_timeline("system", "Emergency Command Center initialized to standby.")

    def load_scenario(self) -> Dict[str, Any]:
        """Loads the standard 4-incident, 19-resource demo scenario and runs the initial LangGraph workflow."""
        with self._lock:
            self.incidents = get_initial_incidents()
            self.resources = get_initial_resources()
            self.allocations = {inc_id: [] for inc_id in self.incidents.keys()}
            self.previous_allocations = {}
            self.changes = []
            self.alerts = []
            self.timeline = []
            self.last_replan_event = None

            self._log_timeline("system", "Loaded multi-incident emergency response scenario.")

        # Execute initial workflow
        return self.run_graph(trigger_type="load_scenario", trigger_reason="Initial scenario deployment")

    def run_graph(
        self,
        trigger_type: str = "general",
        current_incident_id: Optional[str] = None,
        trigger_reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Executes the compiled LangGraph StateGraph across current incidents and resources."""
        with self._lock:
            # Snapshot state for Graph input
            graph_input: CrisisState = {
                "incidents": copy.deepcopy(self.incidents),
                "resources": copy.deepcopy(self.resources),
                "current_incident_id": current_incident_id,
                "trigger_type": trigger_type,
                "assessments": {},
                "priorities": {},
                "resource_requirements": {},
                "allocations": copy.deepcopy(self.allocations),
                "previous_allocations": copy.deepcopy(self.previous_allocations),
                "response_plan": copy.deepcopy(self.current_plan),
                "changes": [],
                "alerts": list(self.alerts),
                "conflicts": [],
                "human_approval_required": False,
                "approval_reasons": [],
                "approval_status": "proposed",
                "replanning_triggered": trigger_type in ["replan", "resource_failure", "new_incident"],
                "replanning_reason": trigger_reason,
                "execution_status": "started",
                "timeline": copy.deepcopy(self.timeline),
                "timestamps": {"started_at": datetime.now(timezone.utc).isoformat()}
            }

        # Run LangGraph workflow outside lock to prevent blocking
        result_state = crisis_graph.invoke(graph_input)

        with self._lock:
            self.incidents = result_state.get("incidents", self.incidents)
            self.resources = result_state.get("resources", self.resources)
            self.previous_allocations = result_state.get("previous_allocations", self.previous_allocations)
            self.allocations = result_state.get("allocations", self.allocations)
            self.current_plan = result_state.get("response_plan")
            self.timeline = result_state.get("timeline", self.timeline)
            self.alerts = result_state.get("alerts", self.alerts)

            new_changes = result_state.get("changes", [])
            if new_changes:
                self.changes = new_changes + self.changes

            # If replanning was triggered, register the event for the UI
            if result_state.get("replanning_triggered"):
                self.last_replan_event = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "reason": trigger_reason or "Dynamic tactical re-evaluation",
                    "before_allocations": copy.deepcopy(self.previous_allocations),
                    "after_allocations": copy.deepcopy(self.allocations),
                    "changes": copy.deepcopy(new_changes),
                    "human_approval_required": result_state.get("human_approval_required", False),
                    "approval_reasons": result_state.get("approval_reasons", []),
                    "approval_status": result_state.get("approval_status", "proposed")
                }

        return result_state

    def create_incident(self, data: IncidentCreate) -> Dict[str, Any]:
        """Creates a new emergency incident and triggers the LangGraph workflow."""
        inc_id = f"INC-{uuid.uuid4().hex[:3].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        incident_dict = {
            "incident_id": inc_id,
            "incident_type": data.incident_type.value if data.incident_type else IncidentType.OTHER.value,
            "title": data.title,
            "description": data.description,
            "location": data.location,
            "latitude": data.latitude if data.latitude is not None else 37.7749,
            "longitude": data.longitude if data.longitude is not None else -122.4194,
            "severity": data.severity or 5,
            "urgency": data.urgency or 5,
            "people_affected": data.people_affected,
            "estimated_casualties": data.estimated_casualties,
            "required_resources": data.required_resources or {},
            "allocated_resources": [],
            "status": IncidentStatus.REPORTED.value,
            "priority_score": 0.0,
            "priority_level": "LOW",
            "priority_factors": {},
            "assessment_explanation": None,
            "response_plan_summary": None,
            "created_at": now_iso,
            "updated_at": now_iso
        }

        with self._lock:
            self.incidents[inc_id] = incident_dict
            self.allocations[inc_id] = []
            self._log_timeline("incident_created", f"Emergency reported: {data.title} ({inc_id})")

        # Run LangGraph
        self.run_graph(
            trigger_type="new_incident",
            current_incident_id=inc_id,
            trigger_reason=f"New incoming emergency: {data.title}"
        )

        return self.incidents[inc_id]

    def trigger_chemical_explosion_demo(self) -> Dict[str, Any]:
        """Demonstrates arrival of a high-severity critical emergency preempting lower-priority units."""
        crit_data = get_chemical_explosion_incident()
        inc_id = crit_data["incident_id"]

        with self._lock:
            self.incidents[inc_id] = crit_data
            self.allocations[inc_id] = []
            self._log_timeline("critical_alert", f"🚨 CRITICAL INCIDENT REPORTED: {crit_data['title']} at {crit_data['location']}")

        # Trigger dynamic replanning through LangGraph
        res = self.run_graph(
            trigger_type="new_incident",
            current_incident_id=inc_id,
            trigger_reason="High-severity Chemical Explosion detected - immediate life-safety reallocation required."
        )
        return res

    def trigger_resource_failure_demo(self) -> Dict[str, Any]:
        """Simulates an active resource breakdown/failure while assigned, triggering replanning."""
        with self._lock:
            # Find an assigned resource, preferably an ambulance
            target_res_id = None
            assigned_inc_title = "Field"
            for r_id, res in self.resources.items():
                if res.get("status") == ResourceStatus.ASSIGNED.value and res.get("resource_type") == "ambulance":
                    target_res_id = r_id
                    break

            if not target_res_id:
                for r_id, res in self.resources.items():
                    if res.get("status") == ResourceStatus.ASSIGNED.value:
                        target_res_id = r_id
                        break

            if not target_res_id:
                target_res_id = "AMB-01"

            # Mark unavailable
            res = self.resources.get(target_res_id, {})
            res["status"] = ResourceStatus.UNAVAILABLE.value
            res["availability"] = False
            prev_inc = res.get("assigned_incident_id")
            if prev_inc and prev_inc in self.incidents:
                assigned_inc_title = self.incidents[prev_inc].get("title", prev_inc)
                if target_res_id in self.incidents[prev_inc].get("allocated_resources", []):
                    self.incidents[prev_inc]["allocated_resources"].remove(target_res_id)
                if prev_inc in self.allocations and target_res_id in self.allocations[prev_inc]:
                    self.allocations[prev_inc].remove(target_res_id)

            res["assigned_incident_id"] = None

            self._log_timeline("resource_failure", f"⚠️ Resource Failure: {res.get('name', target_res_id)} experienced engine/equipment failure and is UNAVAILABLE.")
            self.alerts.insert(0, f"RESOURCE FAILURE: {res.get('name', target_res_id)} taken offline while supporting {assigned_inc_title}.")

        return self.run_graph(
            trigger_type="resource_failure",
            trigger_reason=f"Resource {target_res_id} failed in field - dynamic replanning initiated to replace missing capacity."
        )

    def mark_resource_unavailable(self, resource_id: str) -> Dict[str, Any]:
        """Marks a resource unavailable and triggers reallocation."""
        with self._lock:
            if resource_id not in self.resources:
                raise KeyError(f"Resource {resource_id} not found.")

            res = self.resources[resource_id]
            res["status"] = ResourceStatus.UNAVAILABLE.value
            res["availability"] = False
            prev_inc = res.get("assigned_incident_id")
            if prev_inc and prev_inc in self.allocations:
                if resource_id in self.allocations[prev_inc]:
                    self.allocations[prev_inc].remove(resource_id)
            res["assigned_incident_id"] = None
            self._log_timeline("resource_status", f"Resource {res.get('name', resource_id)} marked UNAVAILABLE.")

        return self.run_graph(
            trigger_type="resource_failure",
            trigger_reason=f"Resource {resource_id} set to unavailable"
        )

    def toggle_resource_status(self, resource_id: str) -> Dict[str, Any]:
        """Toggles resource status between available and unavailable."""
        with self._lock:
            if resource_id not in self.resources:
                raise KeyError(f"Resource {resource_id} not found.")
            res = self.resources[resource_id]
            if res.get("status") == ResourceStatus.UNAVAILABLE.value or not res.get("availability"):
                res["status"] = ResourceStatus.AVAILABLE.value
                res["availability"] = True
                res["assigned_incident_id"] = None
                self._log_timeline("resource_status", f"Unit {res.get('name', resource_id)} restored to AVAILABLE reserve status.")
                trigger_reason = f"Resource {resource_id} restored to service"
            else:
                res["status"] = ResourceStatus.UNAVAILABLE.value
                res["availability"] = False
                prev_inc = res.get("assigned_incident_id")
                if prev_inc and prev_inc in self.allocations:
                    if resource_id in self.allocations[prev_inc]:
                        self.allocations[prev_inc].remove(resource_id)
                if prev_inc and prev_inc in self.incidents:
                    if resource_id in self.incidents[prev_inc].get("allocated_resources", []):
                        self.incidents[prev_inc]["allocated_resources"].remove(resource_id)
                res["assigned_incident_id"] = None
                self._log_timeline("resource_status", f"Unit {res.get('name', resource_id)} rotated to MAINTENANCE / UNAVAILABLE.")
                trigger_reason = f"Resource {resource_id} set to unavailable"

        return self.run_graph(
            trigger_type="replan",
            trigger_reason=trigger_reason
        )

    def direct_dispatch(self, resource_id: str, incident_id: str) -> Dict[str, Any]:
        """Commander directly authorizes deployment of an apparatus to an active incident."""
        with self._lock:
            if resource_id not in self.resources:
                raise KeyError(f"Resource {resource_id} not found.")
            if incident_id not in self.incidents:
                raise KeyError(f"Incident {incident_id} not found.")

            res = self.resources[resource_id]
            inc = self.incidents[incident_id]

            prev_inc = res.get("assigned_incident_id")
            if prev_inc and prev_inc in self.allocations and resource_id in self.allocations[prev_inc]:
                self.allocations[prev_inc].remove(resource_id)
            if prev_inc and prev_inc in self.incidents and resource_id in self.incidents[prev_inc].get("allocated_resources", []):
                self.incidents[prev_inc]["allocated_resources"].remove(resource_id)

            res["status"] = ResourceStatus.ASSIGNED.value
            res["availability"] = False
            res["assigned_incident_id"] = incident_id

            if incident_id not in self.allocations:
                self.allocations[incident_id] = []
            if resource_id not in self.allocations[incident_id]:
                self.allocations[incident_id].append(resource_id)

            if "allocated_resources" not in inc or inc["allocated_resources"] is None:
                inc["allocated_resources"] = []
            if resource_id not in inc["allocated_resources"]:
                inc["allocated_resources"].append(resource_id)

            self._log_timeline("direct_dispatch", f"Direct Commander Dispatch: {res.get('name', resource_id)} ordered to {inc.get('title', incident_id)}.")
            self.alerts.insert(0, f"DIRECT DISPATCH: {res.get('name', resource_id)} routed to {inc.get('title')}.")

        return self.run_graph(
            trigger_type="replan",
            trigger_reason=f"Direct tactical dispatch of {resource_id} to {incident_id}"
        )

    def resolve_incident(self, incident_id: str) -> Dict[str, Any]:
        """Resolves an incident, frees its resources, and triggers replanning."""
        with self._lock:
            if incident_id not in self.incidents:
                raise KeyError(f"Incident {incident_id} not found.")

            inc = self.incidents[incident_id]
            inc["status"] = IncidentStatus.RESOLVED.value
            freed_resources = list(inc.get("allocated_resources", []))
            inc["allocated_resources"] = []
            if incident_id in self.allocations:
                self.allocations[incident_id] = []

            for r_id in freed_resources:
                if r_id in self.resources:
                    self.resources[r_id]["status"] = ResourceStatus.AVAILABLE.value
                    self.resources[r_id]["assigned_incident_id"] = None

            self._log_timeline("incident_resolved", f"Incident resolved: {inc.get('title')} ({incident_id}). {len(freed_resources)} units freed.")

        return self.run_graph(
            trigger_type="incident_resolved",
            trigger_reason=f"Incident {incident_id} resolved - surplus resources released to pool."
        )

    def handle_human_approval(self, action: str, reviewer_notes: Optional[str] = None) -> Dict[str, Any]:
        """Processes human command action (approve, reject, review)."""
        with self._lock:
            action_lower = action.lower()
            if self.current_plan:
                if action_lower == "approve":
                    self.current_plan["approval_status"] = "approved"
                    self.current_plan["human_approval_required"] = False
                    self.last_replan_event = None
                    self.alerts = [a for a in self.alerts if "HUMAN APPROVAL REQUIRED" not in a]
                    self._log_timeline("approval", f"Human Commander APPROVED the response plan. Notes: {reviewer_notes or 'None'}")
                elif action_lower == "reject":
                    self.current_plan["approval_status"] = "rejected"
                    self.current_plan["human_approval_required"] = False
                    self.last_replan_event = None
                    self.alerts = [a for a in self.alerts if "HUMAN APPROVAL REQUIRED" not in a]
                    self._log_timeline("approval", f"Human Commander REJECTED the response plan. Notes: {reviewer_notes or 'Requires manual reallocation.'}")
                elif action_lower == "review":
                    self.current_plan["approval_status"] = "in_review"
                    self._log_timeline("approval", f"Plan placed under detailed review by Commander.")

            if self.last_replan_event:
                self.last_replan_event["approval_status"] = self.current_plan.get("approval_status") if self.current_plan else action_lower

            return {
                "status": "success",
                "action": action,
                "current_approval_status": self.current_plan.get("approval_status") if self.current_plan else "none",
                "notes": reviewer_notes
            }

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Provides real-time aggregated metrics for the frontend dashboard cards."""
        with self._lock:
            active_incidents = [i for i in self.incidents.values() if i.get("status") not in ["resolved", "contained"]]
            critical_incidents = [i for i in active_incidents if i.get("priority_level") == "CRITICAL"]

            # Count available resources by type
            avail_ambulances = sum(
                1 for r in self.resources.values()
                if r.get("resource_type") == "ambulance" and r.get("status") == ResourceStatus.AVAILABLE.value
            )
            avail_rescue = sum(
                1 for r in self.resources.values()
                if r.get("resource_type") == "rescue_team" and r.get("status") == ResourceStatus.AVAILABLE.value
            )
            avail_medical = sum(
                1 for r in self.resources.values()
                if r.get("resource_type") == "medical_unit" and r.get("status") == ResourceStatus.AVAILABLE.value
            )
            total_assigned = sum(
                1 for r in self.resources.values()
                if r.get("status") == ResourceStatus.ASSIGNED.value
            )

            return {
                "active_incidents_count": len(active_incidents),
                "critical_incidents_count": len(critical_incidents),
                "available_ambulances": avail_ambulances,
                "available_rescue_teams": avail_rescue,
                "available_medical_units": avail_medical,
                "resources_currently_assigned": total_assigned,
                "total_resources": len(self.resources),
                "human_approval_required": self.current_plan.get("human_approval_required", False) if self.current_plan else False,
                "approval_reasons": self.current_plan.get("approval_reasons", []) if self.current_plan else [],
                "approval_status": self.current_plan.get("approval_status", "none") if self.current_plan else "none",
                "last_replan_event": self.last_replan_event,
                "alerts": self.alerts[:10],
                "timeline": list(reversed(self.timeline[-20:]))
            }

    def inject_scenario(self, scenario_type: str) -> Dict[str, Any]:
        """Injects dynamic multi-hazard disaster scenarios."""
        now_iso = datetime.now(timezone.utc).isoformat()
        scenario_key = scenario_type.lower()

        if scenario_key == "earthquake":
            inc_id = f"INC-EQ-{uuid.uuid4().hex[:3].upper()}"
            incident = {
                "incident_id": inc_id,
                "incident_type": IncidentType.BUILDING_COLLAPSE.value,
                "title": "7.1 Richter Earthquake - Multi-Building Structural Collapse",
                "description": "Severe seismic shock collapses 2 multi-story structures. Gas leaks detected. Multiple victims pinned under heavy debris.",
                "location": "Financial District, Market & 1st St",
                "latitude": 37.7915,
                "longitude": -122.3995,
                "severity": 10,
                "urgency": 10,
                "people_affected": 85,
                "estimated_casualties": 28,
                "required_resources": {"rescue_team": 3, "ambulance": 4, "medical_unit": 2, "fire_unit": 2},
                "allocated_resources": [],
                "status": IncidentStatus.REPORTED.value,
                "priority_score": 96.5,
                "priority_level": "CRITICAL",
                "created_at": now_iso,
                "updated_at": now_iso
            }
            trigger_reason = "Catastrophic 7.1 Earthquake - Mass casualty collapse triggered"
        elif scenario_key == "flood":
            inc_id = f"INC-FL-{uuid.uuid4().hex[:3].upper()}"
            incident = {
                "incident_id": inc_id,
                "incident_type": IncidentType.FLOOD.value,
                "title": "Flash Flood & Storm Surge - Transit Basin Inundation",
                "description": "Rapid water surge inundates subway concourses and lower highway artery. 45 commuters stranded on rooftops and vehicle hoods.",
                "location": "Mission Creek Basin / SOMA Underpass",
                "latitude": 37.7710,
                "longitude": -122.3980,
                "severity": 8,
                "urgency": 9,
                "people_affected": 60,
                "estimated_casualties": 6,
                "required_resources": {"rescue_team": 2, "ambulance": 3, "shelter": 1, "police_unit": 2},
                "allocated_resources": [],
                "status": IncidentStatus.REPORTED.value,
                "priority_score": 88.0,
                "priority_level": "CRITICAL",
                "created_at": now_iso,
                "updated_at": now_iso
            }
            trigger_reason = "Severe Flash Flood & Inundation - Water extraction teams prioritized"
        elif scenario_key == "wildfire":
            inc_id = f"INC-WF-{uuid.uuid4().hex[:3].upper()}"
            incident = {
                "incident_id": inc_id,
                "incident_type": IncidentType.FIRE.value,
                "title": "Wildland-Urban Interface Fire - Hillside Evacuation Breach",
                "description": "Wind-driven fire front advancing rapidly toward high-density residential perimeter. Structural defense and mass evacuation underway.",
                "location": "Twin Peaks North Crest & Panorama Dr",
                "latitude": 37.7544,
                "longitude": -122.4477,
                "severity": 9,
                "urgency": 9,
                "people_affected": 120,
                "estimated_casualties": 8,
                "required_resources": {"fire_unit": 4, "police_unit": 3, "ambulance": 2, "shelter": 1},
                "allocated_resources": [],
                "status": IncidentStatus.REPORTED.value,
                "priority_score": 93.0,
                "priority_level": "CRITICAL",
                "created_at": now_iso,
                "updated_at": now_iso
            }
            trigger_reason = "Wildland Interface Fire Surge - Life-safety containment mobilized"
        elif scenario_key == "blackout":
            inc_id = f"INC-PW-{uuid.uuid4().hex[:3].upper()}"
            incident = {
                "incident_id": inc_id,
                "incident_type": IncidentType.OTHER.value,
                "title": "Regional Grid Collapse & Hospital Generator Failure",
                "description": "Substation explosion cuts auxiliary power to regional clinic. ICU patient life-support running on limited battery reserves.",
                "location": "Metro Community Hospital, Sector 6",
                "latitude": 37.7850,
                "longitude": -122.4350,
                "severity": 9,
                "urgency": 10,
                "people_affected": 40,
                "estimated_casualties": 12,
                "required_resources": {"medical_unit": 2, "ambulance": 4, "rescue_team": 1},
                "allocated_resources": [],
                "status": IncidentStatus.REPORTED.value,
                "priority_score": 94.5,
                "priority_level": "CRITICAL",
                "created_at": now_iso,
                "updated_at": now_iso
            }
            trigger_reason = "Grid Blackout Life-Support Crisis - Mobile medical intervention required"
        else:
            return self.trigger_chemical_explosion_demo()

        with self._lock:
            self.incidents[inc_id] = incident
            self.allocations[inc_id] = []
            self._log_timeline("disaster_scenario", f"🚨 DISASTER SCENARIO INJECTED: {incident['title']}")
            self.alerts.insert(0, f"SCENARIO ALERT: {incident['title']} injected into emergency grid.")

        return self.run_graph(
            trigger_type="new_incident",
            current_incident_id=inc_id,
            trigger_reason=trigger_reason
        )

    def process_tactical_command(self, query: str) -> Dict[str, Any]:
        """Interprets natural language commands and executes tactical agent actions."""
        q = query.lower().strip()

        with self._lock:
            active_count = sum(1 for i in self.incidents.values() if i.get("status") not in ["resolved", "contained"])
            avail_amb = sum(1 for r in self.resources.values() if r.get("resource_type") == "ambulance" and r.get("status") == ResourceStatus.AVAILABLE.value)
            avail_fire = sum(1 for r in self.resources.values() if r.get("resource_type") == "fire_unit" and r.get("status") == ResourceStatus.AVAILABLE.value)
            avail_rescue = sum(1 for r in self.resources.values() if r.get("resource_type") == "rescue_team" and r.get("status") == ResourceStatus.AVAILABLE.value)
            avail_police = sum(1 for r in self.resources.values() if r.get("resource_type") == "police_unit" and r.get("status") == ResourceStatus.AVAILABLE.value)

        # 1. Replan query
        if any(w in q for w in ["replan", "reallocate", "optimize", "redistribute"]):
            self.run_graph(trigger_type="replan", trigger_reason=f"Commander voice/AI request: '{query}'")
            return {
                "reply": f"Tactical Replan executed across all sectors. {active_count} active emergencies re-evaluated.",
                "action": "replan_triggered"
            }

        # 2. Approve query
        if any(w in q for w in ["approve", "authorize", "confirm plan", "accept plan"]):
            self.handle_human_approval("approve", "Approved via Tactical AI Command")
            return {
                "reply": "Tactical Response Plan has been officially APPROVED by Commander authorization.",
                "action": "approval_granted"
            }

        # 3. Fleet readiness queries
        if any(w in q for w in ["ambulance", "medic", "ems"]):
            return {
                "reply": f"Medical Fleet Readiness: {avail_amb} ambulances available in ready reserve. Mobile trauma capacity operational.",
                "action": "status_check"
            }
        if any(w in q for w in ["fire", "engine", "hazmat"]):
            return {
                "reply": f"Fire & HazMat Readiness: {avail_fire} fire apparatus ready for dispatch across stations.",
                "action": "status_check"
            }
        if any(w in q for w in ["rescue", "sar", "extraction"]):
            return {
                "reply": f"Search & Rescue Readiness: {avail_rescue} tactical extraction teams standing by.",
                "action": "status_check"
            }

        # 4. Casualty or priority inquiry
        if any(w in q for w in ["casualty", "casualties", "worst", "critical", "highest priority"]):
            active_list = [i for i in self.incidents.values() if i.get("status") not in ["resolved", "contained"]]
            if active_list:
                worst = max(active_list, key=lambda x: (x.get("priority_score", 0), x.get("estimated_casualties", 0)))
                return {
                    "reply": f"Highest Priority Incident: '{worst.get('title')}' at {worst.get('location')} (Priority: {worst.get('priority_score', 0):.1f}, Casualties: {worst.get('estimated_casualties')}).",
                    "action": "incident_focus",
                    "incident_id": worst.get("incident_id")
                }

        # 5. General status overview
        return {
            "reply": f"Tactical Status: {active_count} active incidents across defense grid. Reserves: {avail_amb} ambulances, {avail_fire} fire units, {avail_rescue} rescue teams, {avail_police} police units ready.",
            "action": "status_overview"
        }

    def _log_timeline(self, event_type: str, message: str) -> None:
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
        self.timeline.append({
            "timestamp": now_str,
            "type": event_type,
            "message": message
        })


coordination_service = CrisisCoordinationService()
