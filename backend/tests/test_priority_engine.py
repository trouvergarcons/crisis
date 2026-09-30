import pytest
from backend.app.engines.priority_engine import PriorityEngine
from backend.app.models.incident import IncidentPriorityLevel


def test_priority_engine_calculation():
    engine = PriorityEngine(severity_weight=0.4, urgency_weight=0.3, people_weight=0.3)

    # Catastrophic incident: 10 severity, 10 urgency, 50 people, chemical explosion
    score, level, factors = engine.calculate_priority(
        severity=10,
        urgency=10,
        people_affected=50,
        estimated_casualties=10,
        incident_type="chemical_explosion"
    )

    assert score >= 90.0
    assert level == IncidentPriorityLevel.CRITICAL
    assert "explanation" in factors
    assert factors["weights"]["severity"] == 0.4
    assert factors["type_hazard_bonus"] == 5.0


def test_priority_engine_low_incident():
    engine = PriorityEngine()
    score, level, factors = engine.calculate_priority(
        severity=2,
        urgency=2,
        people_affected=1,
        estimated_casualties=0,
        incident_type="other"
    )

    assert score < 45.0
    assert level == IncidentPriorityLevel.LOW


def test_priority_engine_boundary_clamping():
    engine = PriorityEngine()
    score, level, _ = engine.calculate_priority(
        severity=999,
        urgency=999,
        people_affected=10000,
        estimated_casualties=500,
        incident_type="chemical_explosion"
    )
    assert score == 100.0
    assert level == IncidentPriorityLevel.CRITICAL
