import json
import logging
import re
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import httpx

from backend.app.config import settings
from backend.app.models.assessment import IncidentAssessmentOutput

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.model = settings.LLM_MODEL
        self.api_key = settings.LLM_API_KEY

    def assess_incident(self, incident_data: Dict[str, Any]) -> IncidentAssessmentOutput:
        """
        Assess incident description, infer severity, urgency, people at risk,
        and required resource categories using LLM or structured mock.
        """
        # If mock provider or no API key, use domain-specific deterministic heuristics
        if self.provider == "mock" or not self.api_key:
            return self._mock_assessment(incident_data)

        try:
            if self.provider == "openai":
                return self._call_openai_assessment(incident_data)
            elif self.provider == "anthropic":
                return self._call_anthropic_assessment(incident_data)
            else:
                return self._mock_assessment(incident_data)
        except Exception as e:
            logger.warning(f"LLM call failed ({str(e)}), safely falling back to structured fallback: {e}")
            return self._mock_assessment(incident_data)

    def generate_response_rationale(
        self,
        incident_title: str,
        priority_level: str,
        allocated_resources: list[str],
        uncovered_needs: Dict[str, int]
    ) -> str:
        """Generates clear tactical rationale for allocated resources."""
        res_str = ", ".join(allocated_resources) if allocated_resources else "None assigned yet"
        uncovered_str = (
            ", ".join([f"{qty} {k}" for k, qty in uncovered_needs.items() if qty > 0])
            if uncovered_needs and any(v > 0 for v in uncovered_needs.values())
            else "None"
        )

        if priority_level == "CRITICAL":
            return (
                f"Immediate tactical intervention required for {incident_title}. "
                f"Dispatched available high-readiness units ({res_str}). "
                f"Outstanding deficit: {uncovered_str}. Command advisory: continuous triage required."
            )
        elif priority_level == "HIGH":
            return (
                f"High-priority containment underway for {incident_title}. "
                f"Active resource allocation: {res_str}. Deficit: {uncovered_str}. "
                f"Response posture maintained at maximum available capacity."
            )
        elif priority_level == "MEDIUM":
            return (
                f"Standard emergency protocol activated for {incident_title}. "
                f"Allocated: {res_str}. Remaining requests queued for secondary surge allocation."
            )
        else:
            return (
                f"Low-severity support operation for {incident_title}. "
                f"Allocated: {res_str}. Operating under standard perimeter and monitoring guidelines."
            )

    def generate_executive_summary(
        self,
        total_incidents: int,
        critical_count: int,
        replan_occurred: bool,
        reasons: list[str]
    ) -> str:
        """Generates executive situational summary for the dashboard."""
        status = "CRITICAL READINESS" if critical_count > 0 else "OPERATIONAL STABILITY"
        summary = f"Emergency Command Center Status: {status}. Total active incidents: {total_incidents}, with {critical_count} critical priority level. "
        if replan_occurred:
            summary += f"Dynamic replanning triggered due to: {'; '.join(reasons) if reasons else 'operational shift'}. Priority-driven resource distribution re-evaluated."
        else:
            summary += "Resource distribution is stable and operating within allocated operational parameters."
        return summary

    def _mock_assessment(self, incident: Dict[str, Any]) -> IncidentAssessmentOutput:
        """
        Robust domain-heuristic assessment for demo and offline execution.
        Analyzes keywords and context to produce realistic Pydantic output.
        """
        title = incident.get("title", "").lower()
        desc = incident.get("description", "").lower()
        people = incident.get("people_affected", 0) or incident.get("people_at_risk", 0)

        # Explicit preset overrides if present
        if incident.get("severity") and incident.get("urgency") and incident.get("required_resources"):
            inc_type = incident.get("incident_type", "other")
            return IncidentAssessmentOutput(
                incident_type=str(inc_type),
                severity=int(incident["severity"]),
                urgency=int(incident["urgency"]),
                people_at_risk=int(people or 10),
                estimated_casualties=int(incident.get("estimated_casualties", max(0, people // 4))),
                required_resources=dict(incident["required_resources"]),
                hazard_summary=f"Pre-assessed incident: {title.capitalize() or 'Emergency event'}",
                confidence_score=0.98
            )

        # Keyword classification
        text = f"{title} {desc}"

        if "chemical" in text or "explosion" in text or "hazmat" in text or "toxic" in text:
            return IncidentAssessmentOutput(
                incident_type="chemical_explosion",
                severity=10,
                urgency=10,
                people_at_risk=max(people, 50),
                estimated_casualties=max(12, people // 3),
                required_resources={
                    "ambulance": 3,
                    "fire_unit": 2,
                    "medical_unit": 2,
                    "police_unit": 1,
                    "rescue_team": 2
                },
                hazard_summary="High-order blast with catastrophic toxic vapor dispersion and multi-casualty trauma.",
                confidence_score=0.95
            )
        elif "collapse" in text or "rubble" in text or "crushed" in text:
            return IncidentAssessmentOutput(
                incident_type="building_collapse",
                severity=9,
                urgency=10,
                people_at_risk=max(people, 30),
                estimated_casualties=max(6, people // 4),
                required_resources={
                    "ambulance": 2,
                    "rescue_team": 2,
                    "medical_unit": 1,
                    "fire_unit": 1
                },
                hazard_summary="Structural failure with trapped victims; severe risk of secondary collapse and crush injuries.",
                confidence_score=0.94
            )
        elif "fire" in text or "blaze" in text or "inferno" in text:
            return IncidentAssessmentOutput(
                incident_type="fire",
                severity=8,
                urgency=8,
                people_at_risk=max(people, 20),
                estimated_casualties=max(2, people // 6),
                required_resources={
                    "fire_unit": 2,
                    "ambulance": 1,
                    "police_unit": 1,
                    "shelter": 1
                },
                hazard_summary="Rapid thermal propagation, heavy smoke inhalation hazard, evacuation underway.",
                confidence_score=0.92
            )
        elif "accident" in text or "crash" in text or "collision" in text:
            return IncidentAssessmentOutput(
                incident_type="road_accident",
                severity=7,
                urgency=8,
                people_at_risk=max(people, 8),
                estimated_casualties=max(2, people // 3),
                required_resources={
                    "ambulance": 2,
                    "police_unit": 1,
                    "rescue_team": 1
                },
                hazard_summary="Multi-vehicle traffic impact with entrapment and arterial roadway disruption.",
                confidence_score=0.91
            )
        elif "flood" in text or "water" in text or "submerged" in text:
            return IncidentAssessmentOutput(
                incident_type="flood",
                severity=6,
                urgency=7,
                people_at_risk=max(people, 40),
                estimated_casualties=max(1, people // 10),
                required_resources={
                    "rescue_team": 2,
                    "shelter": 2,
                    "ambulance": 1,
                    "police_unit": 1
                },
                hazard_summary="Rapid rising water levels threatening vulnerable low-lying residences and displacement.",
                confidence_score=0.90
            )
        elif "medical" in text or "cardiac" in text or "respiratory" in text:
            return IncidentAssessmentOutput(
                incident_type="medical_emergency",
                severity=6,
                urgency=8,
                people_at_risk=max(people, 2),
                estimated_casualties=1,
                required_resources={
                    "ambulance": 1,
                    "medical_unit": 1
                },
                hazard_summary="Acute patient health deterioration requiring advanced life support transport.",
                confidence_score=0.92
            )
        else:
            return IncidentAssessmentOutput(
                incident_type="other",
                severity=max(1, min(10, incident.get("severity", 5))),
                urgency=max(1, min(10, incident.get("urgency", 5))),
                people_at_risk=max(1, people),
                estimated_casualties=incident.get("estimated_casualties", 0),
                required_resources={
                    "ambulance": 1,
                    "police_unit": 1
                },
                hazard_summary="General emergency report requiring standard field investigation and perimeter security.",
                confidence_score=0.80
            )

    def _call_openai_assessment(self, incident: Dict[str, Any]) -> IncidentAssessmentOutput:
        prompt = f"""
        You are an Emergency Incident Assessment Agent.
        Analyze this emergency report and return a JSON object:
        Title: {incident.get('title')}
        Description: {incident.get('description')}
        Location: {incident.get('location')}
        Reported People Affected: {incident.get('people_affected')}

        Return JSON matching this exact structure:
        {{
            "incident_type": "building_collapse" | "road_accident" | "flood" | "fire" | "earthquake" | "chemical_explosion" | "medical_emergency" | "landslide" | "other",
            "severity": (integer 1-10),
            "urgency": (integer 1-10),
            "people_at_risk": (integer >= 0),
            "estimated_casualties": (integer >= 0),
            "required_resources": {{"ambulance": int, "rescue_team": int, "medical_unit": int, "fire_unit": int, "police_unit": int, "shelter": int}},
            "hazard_summary": "concise hazard evaluation string",
            "confidence_score": 0.95
        }}
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a crisis assessment system. Output only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        with httpx.Client(timeout=15.0) as client:
            resp = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return IncidentAssessmentOutput(**parsed)

    def _call_anthropic_assessment(self, incident: Dict[str, Any]) -> IncidentAssessmentOutput:
        prompt = f"""
        Analyze this emergency and output valid JSON only:
        Title: {incident.get('title')}
        Description: {incident.get('description')}
        Location: {incident.get('location')}
        Reported People Affected: {incident.get('people_affected')}

        Format:
        {{
            "incident_type": "...",
            "severity": 1-10,
            "urgency": 1-10,
            "people_at_risk": int,
            "estimated_casualties": int,
            "required_resources": {{"ambulance": 1, ...}},
            "hazard_summary": "...",
            "confidence_score": 0.95
        }}
        """
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        payload = {
            "model": self.model,
            "max_tokens": 1000,
            "messages": [{"role": "user", "content": prompt}]
        }
        with httpx.Client(timeout=15.0) as client:
            resp = client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["content"][0]["text"]
            match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if match:
                raw_text = match.group(0)
            parsed = json.loads(raw_text)
            return IncidentAssessmentOutput(**parsed)


llm_service = LLMService()
