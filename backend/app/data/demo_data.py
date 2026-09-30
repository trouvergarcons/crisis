from typing import Dict, Any
from datetime import datetime, timezone
from backend.app.models.resource import ResourceStatus, ResourceType
from backend.app.models.incident import IncidentStatus, IncidentType, IncidentPriorityLevel


def get_initial_resources() -> Dict[str, Dict[str, Any]]:
    """Generates initial pool of emergency response resources."""
    now_iso = datetime.now(timezone.utc).isoformat()
    return {
        # 5 Ambulances
        "AMB-01": {
            "resource_id": "AMB-01",
            "resource_type": ResourceType.AMBULANCE.value,
            "name": "Medic Ambulance 01",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "Central Station",
            "latitude": 37.7749,
            "longitude": -122.4194,
            "availability": True,
            "capacity": 2,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },
        "AMB-02": {
            "resource_id": "AMB-02",
            "resource_type": ResourceType.AMBULANCE.value,
            "name": "Medic Ambulance 02",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "North Station",
            "latitude": 37.7849,
            "longitude": -122.4094,
            "availability": True,
            "capacity": 2,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },
        "AMB-03": {
            "resource_id": "AMB-03",
            "resource_type": ResourceType.AMBULANCE.value,
            "name": "Medic Ambulance 03",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "East Bay Station",
            "latitude": 37.7649,
            "longitude": -122.4294,
            "availability": True,
            "capacity": 2,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },
        "AMB-04": {
            "resource_id": "AMB-04",
            "resource_type": ResourceType.AMBULANCE.value,
            "name": "Medic Ambulance 04",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "South Station",
            "latitude": 37.7549,
            "longitude": -122.4194,
            "availability": True,
            "capacity": 2,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },
        "AMB-05": {
            "resource_id": "AMB-05",
            "resource_type": ResourceType.AMBULANCE.value,
            "name": "Medic Ambulance 05",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "West Station",
            "latitude": 37.7749,
            "longitude": -122.4494,
            "availability": True,
            "capacity": 2,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },

        # 3 Rescue Teams
        "RESCUE-01": {
            "resource_id": "RESCUE-01",
            "resource_type": ResourceType.RESCUE_TEAM.value,
            "name": "Search & Rescue Alpha",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "Downtown Headquarters",
            "latitude": 37.7720,
            "longitude": -122.4150,
            "availability": True,
            "capacity": 6,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },
        "RESCUE-02": {
            "resource_id": "RESCUE-02",
            "resource_type": ResourceType.RESCUE_TEAM.value,
            "name": "Technical Rescue Bravo",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "North Bay Depository",
            "latitude": 37.7800,
            "longitude": -122.4200,
            "availability": True,
            "capacity": 6,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },
        "RESCUE-03": {
            "resource_id": "RESCUE-03",
            "resource_type": ResourceType.RESCUE_TEAM.value,
            "name": "Rapid Extraction Charlie",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "Metro Transit Center",
            "latitude": 37.7600,
            "longitude": -122.4300,
            "availability": True,
            "capacity": 6,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },

        # 2 Medical Units
        "MED-01": {
            "resource_id": "MED-01",
            "resource_type": ResourceType.MEDICAL_UNIT.value,
            "name": "Mobile Trauma Unit 1",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "General Hospital Base",
            "latitude": 37.7700,
            "longitude": -122.4250,
            "availability": True,
            "capacity": 10,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },
        "MED-02": {
            "resource_id": "MED-02",
            "resource_type": ResourceType.MEDICAL_UNIT.value,
            "name": "Field Surgical Team 2",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "St. Jude Clinic Post",
            "latitude": 37.7850,
            "longitude": -122.4150,
            "availability": True,
            "capacity": 8,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },

        # 3 Fire Units
        "FIRE-01": {
            "resource_id": "FIRE-01",
            "resource_type": ResourceType.FIRE_UNIT.value,
            "name": "Engine 1 Heavy Pumper",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "Engine Co. 1",
            "latitude": 37.7710,
            "longitude": -122.4100,
            "availability": True,
            "capacity": 4,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },
        "FIRE-02": {
            "resource_id": "FIRE-02",
            "resource_type": ResourceType.FIRE_UNIT.value,
            "name": "Ladder 2 High-Rise Truck",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "Engine Co. 2",
            "latitude": 37.7820,
            "longitude": -122.4350,
            "availability": True,
            "capacity": 4,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },
        "FIRE-03": {
            "resource_id": "FIRE-03",
            "resource_type": ResourceType.FIRE_UNIT.value,
            "name": "HazMat Suppression Unit 3",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "Port Station",
            "latitude": 37.7650,
            "longitude": -122.4050,
            "availability": True,
            "capacity": 4,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },

        # 2 Police Units
        "POLICE-01": {
            "resource_id": "POLICE-01",
            "resource_type": ResourceType.POLICE_UNIT.value,
            "name": "Tactical Patrol 01",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "Central Precinct",
            "latitude": 37.7780,
            "longitude": -122.4220,
            "availability": True,
            "capacity": 2,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },
        "POLICE-02": {
            "resource_id": "POLICE-02",
            "resource_type": ResourceType.POLICE_UNIT.value,
            "name": "Perimeter Control 02",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "Mission District Substation",
            "latitude": 37.7680,
            "longitude": -122.4180,
            "availability": True,
            "capacity": 2,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },

        # 4 Shelters
        "SHELTER-01": {
            "resource_id": "SHELTER-01",
            "resource_type": ResourceType.SHELTER.value,
            "name": "Civic Center Emergency Haven",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "Civic Center Plaza",
            "latitude": 37.7795,
            "longitude": -122.4180,
            "availability": True,
            "capacity": 250,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },
        "SHELTER-02": {
            "resource_id": "SHELTER-02",
            "resource_type": ResourceType.SHELTER.value,
            "name": "West Valley Haven",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "Sunset Boulevard",
            "latitude": 37.7650,
            "longitude": -122.4400,
            "availability": True,
            "capacity": 180,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },
        "SHELTER-03": {
            "resource_id": "SHELTER-03",
            "resource_type": ResourceType.SHELTER.value,
            "name": "North Shore Pavilion",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "Marina Green",
            "latitude": 37.7900,
            "longitude": -122.4100,
            "availability": True,
            "capacity": 150,
            "assigned_incident_id": None,
            "last_updated": now_iso
        },
        "SHELTER-04": {
            "resource_id": "SHELTER-04",
            "resource_type": ResourceType.SHELTER.value,
            "name": "South High Gymnasium",
            "status": ResourceStatus.AVAILABLE.value,
            "location": "Potrero Hill",
            "latitude": 37.7500,
            "longitude": -122.4200,
            "availability": True,
            "capacity": 300,
            "assigned_incident_id": None,
            "last_updated": now_iso
        }
    }


def get_initial_incidents() -> Dict[str, Dict[str, Any]]:
    """Generates initial batch of 4 simultaneous emergencies."""
    now_iso = datetime.now(timezone.utc).isoformat()
    return {
        "INC-001": {
            "incident_id": "INC-001",
            "incident_type": IncidentType.BUILDING_COLLAPSE.value,
            "title": "Commercial Building Collapse",
            "description": "Multi-story commercial annex suffered partial structural failure. Concrete slab failure on floors 2-4 with occupants trapped in stairwell.",
            "location": "Sector 12 Financial Center, 450 Market St",
            "latitude": 37.7905,
            "longitude": -122.3995,
            "severity": 9,
            "urgency": 10,
            "people_affected": 30,
            "estimated_casualties": 8,
            "required_resources": {
                "ambulance": 2,
                "rescue_team": 1,
                "medical_unit": 1
            },
            "allocated_resources": [],
            "status": IncidentStatus.ASSESSED.value,
            "priority_score": 94.0,
            "priority_level": IncidentPriorityLevel.CRITICAL.value,
            "priority_factors": {
                "severity_score": 90.0,
                "urgency_score": 100.0,
                "people_score": 85.0,
                "type_hazard_bonus": 4.0
            },
            "assessment_explanation": "Severe structural collapse with trapped victims and active risk of progressive failure.",
            "created_at": now_iso,
            "updated_at": now_iso
        },
        "INC-002": {
            "incident_id": "INC-002",
            "incident_type": IncidentType.ROAD_ACCIDENT.value,
            "title": "Multi-Vehicle Highway Pileup",
            "description": "Commercial freight truck and four passenger vehicles collided at high speed on overpass. Fuel leak detected with two occupants pinned.",
            "location": "Highway 101 Overpass & 8th St",
            "latitude": 37.7712,
            "longitude": -122.4124,
            "severity": 7,
            "urgency": 8,
            "people_affected": 8,
            "estimated_casualties": 3,
            "required_resources": {
                "ambulance": 2,
                "police_unit": 1,
                "rescue_team": 1
            },
            "allocated_resources": [],
            "status": IncidentStatus.ASSESSED.value,
            "priority_score": 73.0,
            "priority_level": IncidentPriorityLevel.HIGH.value,
            "priority_factors": {
                "severity_score": 70.0,
                "urgency_score": 80.0,
                "people_score": 50.0,
                "type_hazard_bonus": 1.0
            },
            "assessment_explanation": "Entrapped trauma patients on active roadway with hazardous flammable fluid runoff.",
            "created_at": now_iso,
            "updated_at": now_iso
        },
        "INC-003": {
            "incident_id": "INC-003",
            "incident_type": IncidentType.FLOOD.value,
            "title": "Lowland Flash Flood & Levee Breach",
            "description": "Storm water surge caused secondary levee retention failure. 18 residential houses taking floodwaters up to 4 feet; ground floor evacuations required.",
            "location": "Marina Basin Residential District",
            "latitude": 37.8030,
            "longitude": -122.4360,
            "severity": 6,
            "urgency": 7,
            "people_affected": 50,
            "estimated_casualties": 1,
            "required_resources": {
                "rescue_team": 1,
                "shelter": 2,
                "ambulance": 1
            },
            "allocated_resources": [],
            "status": IncidentStatus.ASSESSED.value,
            "priority_score": 64.0,
            "priority_level": IncidentPriorityLevel.MEDIUM.value,
            "priority_factors": {
                "severity_score": 60.0,
                "urgency_score": 70.0,
                "people_score": 90.0,
                "type_hazard_bonus": 1.0
            },
            "assessment_explanation": "Extensive residential displacement with isolated civilians stranded on upper floors.",
            "created_at": now_iso,
            "updated_at": now_iso
        },
        "INC-004": {
            "incident_id": "INC-004",
            "incident_type": IncidentType.FIRE.value,
            "title": "Industrial Warehouse Structure Fire",
            "description": "3-alarm structure fire in commercial manufacturing depot containing palletized wooden crates and industrial paints.",
            "location": "Industrial Warehouse Park, Pier 70",
            "latitude": 37.7580,
            "longitude": -122.3880,
            "severity": 8,
            "urgency": 8,
            "people_affected": 15,
            "estimated_casualties": 2,
            "required_resources": {
                "fire_unit": 2,
                "ambulance": 1,
                "police_unit": 1
            },
            "allocated_resources": [],
            "status": IncidentStatus.ASSESSED.value,
            "priority_score": 80.0,
            "priority_level": IncidentPriorityLevel.HIGH.value,
            "priority_factors": {
                "severity_score": 80.0,
                "urgency_score": 80.0,
                "people_score": 65.0,
                "type_hazard_bonus": 3.0
            },
            "assessment_explanation": "Active fire growth with toxic smoke plumes heading toward downwind commercial district.",
            "created_at": now_iso,
            "updated_at": now_iso
        }
    }


def get_chemical_explosion_incident() -> Dict[str, Any]:
    """Generates the critical incident for dynamic replanning demonstration."""
    now_iso = datetime.now(timezone.utc).isoformat()
    return {
        "incident_id": "INC-005",
        "incident_type": IncidentType.CHEMICAL_EXPLOSION.value,
        "title": "Industrial Chemical Plant Explosion",
        "description": "Catastrophic vessel detonation at chemical processing complex. High toxic chlorine plume releasing rapidly. Mass casualties reported and secondary pressure vessels at risk.",
        "location": "Bayview Chemical Refining Plant, 1200 Evans Ave",
        "latitude": 37.7400,
        "longitude": -122.3800,
        "severity": 10,
        "urgency": 10,
        "people_affected": 50,
        "estimated_casualties": 15,
        "required_resources": {
            "ambulance": 3,
            "fire_unit": 2,
            "rescue_team": 1,
            "medical_unit": 1,
            "police_unit": 1
        },
        "allocated_resources": [],
        "status": IncidentStatus.REPORTED.value,
        "priority_score": 99.0,
        "priority_level": IncidentPriorityLevel.CRITICAL.value,
        "priority_factors": {
            "severity_score": 100.0,
            "urgency_score": 100.0,
            "people_score": 100.0,
            "type_hazard_bonus": 5.0,
            "casualty_bonus": 8.0
        },
        "assessment_explanation": "Category 5 hazardous blast event with lethal inhalation risk and critical triage needs.",
        "created_at": now_iso,
        "updated_at": now_iso
    }
