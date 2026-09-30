from typing import Dict, Any, Tuple
import math
from backend.app.config import settings
from backend.app.models.incident import IncidentPriorityLevel, IncidentType


class PriorityEngine:
    """
    Deterministic scoring engine calculating reproducible, transparent priority scores (0-100)
    for emergency incidents based on life-safety, severity, urgency, and affected population.
    """

    TYPE_BONUS = {
        "chemical_explosion": 5.0,
        "building_collapse": 4.0,
        "fire": 3.0,
        "earthquake": 3.0,
        "landslide": 2.0,
        "road_accident": 1.0,
        "flood": 1.0,
        "medical_emergency": 1.0,
        "other": 0.0,
    }

    def __init__(
        self,
        severity_weight: float = None,
        urgency_weight: float = None,
        people_weight: float = None
    ):
        self.w_severity = severity_weight if severity_weight is not None else settings.SEVERITY_WEIGHT
        self.w_urgency = urgency_weight if urgency_weight is not None else settings.URGENCY_WEIGHT
        self.w_people = people_weight if people_weight is not None else settings.PEOPLE_AT_RISK_WEIGHT

        # Normalize weights so they always sum to 1.0
        total_w = self.w_severity + self.w_urgency + self.w_people
        if total_w > 0:
            self.w_severity /= total_w
            self.w_urgency /= total_w
            self.w_people /= total_w

    def calculate_priority(
        self,
        severity: int,
        urgency: int,
        people_affected: int,
        estimated_casualties: int = 0,
        incident_type: str = "other"
    ) -> Tuple[float, IncidentPriorityLevel, Dict[str, Any]]:
        """
        Calculates a priority score from 0.0 to 100.0, determines the priority level,
        and provides full breakdown of decision factors.
        """
        # Normalized components (0 - 100)
        sev_clamped = max(1, min(10, severity))
        urg_clamped = max(1, min(10, urgency))
        
        sev_component = (sev_clamped / 10.0) * 100.0
        urg_component = (urg_clamped / 10.0) * 100.0

        # Non-linear population risk curve (log-like to balance small vs mass-casualty events)
        # 1 person -> 15%, 10 people -> 55%, 30 people -> 80%, 50+ people -> 100%
        if people_affected <= 0:
            people_component = 0.0
        else:
            people_component = min(100.0, 15.0 + (math.log10(people_affected + 1) / math.log10(51)) * 85.0)

        # Base weighted calculation
        base_score = (
            (sev_component * self.w_severity) +
            (urg_component * self.w_urgency) +
            (people_component * self.w_people)
        )

        # Life safety hazard bonus
        type_bonus = self.TYPE_BONUS.get(str(incident_type).lower(), 0.0)

        # Casualties direct hazard increment (up to +8 points)
        casualty_bonus = min(8.0, estimated_casualties * 1.5)

        raw_score = base_score + type_bonus + casualty_bonus
        final_score = round(max(0.0, min(100.0, raw_score)), 1)

        # Determine level
        if final_score >= 85.0:
            level = IncidentPriorityLevel.CRITICAL
        elif final_score >= 70.0:
            level = IncidentPriorityLevel.HIGH
        elif final_score >= 45.0:
            level = IncidentPriorityLevel.MEDIUM
        else:
            level = IncidentPriorityLevel.LOW

        factors = {
            "severity_score": sev_component,
            "urgency_score": urg_component,
            "people_score": round(people_component, 1),
            "weights": {
                "severity": round(self.w_severity, 2),
                "urgency": round(self.w_urgency, 2),
                "people_at_risk": round(self.w_people, 2)
            },
            "type_hazard_bonus": type_bonus,
            "casualty_bonus": casualty_bonus,
            "raw_base_score": round(base_score, 1),
            "explanation": (
                f"Priority {final_score}/100 [{level.value}]: Derived from Severity {sev_clamped}/10 "
                f"({round(sev_component * self.w_severity, 1)} pts), Urgency {urg_clamped}/10 "
                f"({round(urg_component * self.w_urgency, 1)} pts), Population Risk {people_affected} "
                f"({round(people_component * self.w_people, 1)} pts), Type Bonus +{type_bonus}."
            )
        }

        return final_score, level, factors


priority_engine = PriorityEngine()
