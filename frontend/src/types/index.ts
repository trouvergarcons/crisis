export type IncidentType =
  | 'building_collapse'
  | 'road_accident'
  | 'flood'
  | 'fire'
  | 'earthquake'
  | 'chemical_explosion'
  | 'medical_emergency'
  | 'landslide'
  | 'other';

export type IncidentStatus = 'reported' | 'assessed' | 'responding' | 'contained' | 'resolved';

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ResourceType =
  | 'ambulance'
  | 'rescue_team'
  | 'medical_unit'
  | 'shelter'
  | 'fire_unit'
  | 'police_unit';

export type ResourceStatus = 'available' | 'assigned' | 'en_route' | 'busy' | 'unavailable';

export interface Incident {
  incident_id: string;
  incident_type: IncidentType;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  severity: number;
  urgency: number;
  people_affected: number;
  estimated_casualties: number;
  required_resources: Record<string, number>;
  allocated_resources: string[];
  status: IncidentStatus;
  priority_score: number;
  priority_level: PriorityLevel;
  priority_factors?: {
    severity_score?: number;
    urgency_score?: number;
    people_score?: number;
    type_hazard_bonus?: number;
    casualty_bonus?: number;
    explanation?: string;
  };
  assessment_explanation?: string;
  response_plan_summary?: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentCreatePayload {
  title: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  incident_type?: IncidentType;
  severity?: number;
  urgency?: number;
  people_affected: number;
  estimated_casualties?: number;
  required_resources?: Record<string, number>;
}

export interface Resource {
  resource_id: string;
  resource_type: ResourceType;
  name: string;
  status: ResourceStatus;
  location: string;
  latitude: number;
  longitude: number;
  availability: boolean;
  capacity?: number | null;
  assigned_incident_id?: string | null;
  last_updated: string;
}

export interface AllocationChange {
  resource_id: string;
  resource_name: string;
  resource_type: string;
  previous_incident_id?: string | null;
  previous_incident_title?: string | null;
  new_incident_id?: string | null;
  new_incident_title?: string | null;
  reason: string;
  timestamp: string;
}

export interface IncidentActionPlan {
  incident_id: string;
  incident_title: string;
  priority_level: PriorityLevel | string;
  priority_score: number;
  actions: string[];
  allocated_resource_ids: string[];
  allocated_resource_details: Array<{
    resource_id: string;
    name: string;
    type: string;
    location: string;
  }>;
  uncovered_needs: Record<string, number>;
  rationale: string;
}

export interface ResponsePlan {
  plan_id: string;
  generated_at: string;
  incident_plans: IncidentActionPlan[];
  total_allocated_resources: number;
  total_uncovered_needs: number;
  human_approval_required: boolean;
  approval_reasons: string[];
  approval_status: 'proposed' | 'approved' | 'rejected' | 'in_review';
  replanning_triggered: boolean;
  trigger_reason?: string | null;
  changes: AllocationChange[];
  executive_summary: string;
}

export interface ReplanEvent {
  timestamp: string;
  reason: string;
  before_allocations: Record<string, string[]>;
  after_allocations: Record<string, string[]>;
  changes: AllocationChange[];
  human_approval_required: boolean;
  approval_reasons: string[];
  approval_status: string;
}

export interface TimelineItem {
  timestamp: string;
  type: string;
  message: string;
}

export interface DashboardMetrics {
  active_incidents_count: number;
  critical_incidents_count: number;
  available_ambulances: number;
  available_rescue_teams: number;
  available_medical_units: number;
  resources_currently_assigned: number;
  total_resources: number;
  human_approval_required: boolean;
  approval_reasons: string[];
  approval_status: string;
  last_replan_event?: ReplanEvent | null;
  alerts: string[];
  timeline: TimelineItem[];
}

export interface DashboardData {
  metrics: DashboardMetrics;
  incidents: Incident[];
  resources: Resource[];
  response_plan?: ResponsePlan | null;
  last_replan_event?: ReplanEvent | null;
  alerts: string[];
  timeline: TimelineItem[];
}
