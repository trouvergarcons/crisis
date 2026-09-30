import React, { useState } from 'react';
import { 
  Flame, 
  AlertOctagon, 
  Truck, 
  Shield, 
  HeartHandshake, 
  CheckCircle, 
  Clock, 
  ArrowUpRight, 
  Activity, 
  AlertTriangle 
} from 'lucide-react';
import { DashboardData, Incident, Resource, Department, UserSession } from '../types';
import { MapComponent } from '../components/MapComponent';
import { ReplanningBanner } from '../components/ReplanningBanner';
import { DepartmentConsole } from '../components/DepartmentConsole';

interface DashboardPageProps {
  data: DashboardData;
  onSelectIncident: (id: string) => void;
  onApproval: (action: 'approve' | 'reject' | 'review', notes?: string) => Promise<void>;
  onNavigateTab: (tab: string) => void;
  onResolveIncident: (id: string) => Promise<void>;
  session?: UserSession | null;
  departmentFilter?: Department;
  onDepartmentFilterChange?: (dept: Department) => void;
  onToggleUnitStatus?: (resourceId: string) => Promise<void>;
  onDirectDispatch?: (resourceId: string, incidentId: string) => Promise<void>;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  onSelectIncident,
  onApproval,
  onNavigateTab,
  onResolveIncident,
  session,
  departmentFilter = 'all',
  onDepartmentFilterChange,
  onToggleUnitStatus,
  onDirectDispatch,
}) => {
  const { metrics, incidents, resources, last_replan_event, alerts, timeline } = data;
  const [showAllAgencies, setShowAllAgencies] = useState<boolean>(departmentFilter === 'all');

  const isIncidentInDept = (inc: Incident, dept: Department): boolean => {
    if (dept === 'all' || showAllAgencies) return true;
    if (dept === 'fire') {
      return inc.incident_type === 'fire' || inc.incident_type === 'chemical_explosion' || (!!inc.required_resources && 'fire_unit' in inc.required_resources);
    }
    if (dept === 'medical') {
      return inc.incident_type === 'medical_emergency' || inc.incident_type === 'road_accident' || inc.estimated_casualties > 0 || (!!inc.required_resources && ('ambulance' in inc.required_resources || 'medical_unit' in inc.required_resources));
    }
    if (dept === 'rescue') {
      return inc.incident_type === 'building_collapse' || inc.incident_type === 'flood' || inc.incident_type === 'earthquake' || inc.incident_type === 'landslide' || (!!inc.required_resources && ('rescue_team' in inc.required_resources || 'shelter' in inc.required_resources));
    }
    if (dept === 'police') {
      return inc.incident_type === 'road_accident' || inc.incident_type === 'chemical_explosion' || (!!inc.required_resources && 'police_unit' in inc.required_resources);
    }
    return true;
  };

  const isResourceInDept = (res: Resource, dept: Department): boolean => {
    if (dept === 'all' || showAllAgencies) return true;
    if (dept === 'fire') return res.resource_type === 'fire_unit';
    if (dept === 'medical') return res.resource_type === 'ambulance' || res.resource_type === 'medical_unit';
    if (dept === 'rescue') return res.resource_type === 'rescue_team' || res.resource_type === 'shelter';
    if (dept === 'police') return res.resource_type === 'police_unit';
    return true;
  };

  const displayedIncidents = incidents.filter((i) => isIncidentInDept(i, departmentFilter));
  const displayedResources = resources.filter((r) => isResourceInDept(r, departmentFilter));
  const activeIncidents = displayedIncidents.filter((i) => i.status !== 'resolved');

  return (
    <div className="space-y-6">
      {/* Detailed Department Commander Console */}
      {session && onDepartmentFilterChange && (
        <DepartmentConsole
          session={session}
          activeDepartment={departmentFilter}
          incidents={displayedIncidents}
          resources={displayedResources}
          onDepartmentChange={onDepartmentFilterChange}
          showAllAgencies={showAllAgencies}
          onToggleShowAll={() => setShowAllAgencies(!showAllAgencies)}
          onToggleUnitStatus={onToggleUnitStatus || (async () => {})}
          onDirectDispatch={onDirectDispatch || (async () => {})}
        />
      )}

      {/* Replanning Banner (if triggered) */}
      <ReplanningBanner
        replanEvent={last_replan_event || null}
        onApproval={onApproval}
        approvalStatus={metrics.approval_status}
      />

      {/* Top 6 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Active Incidents */}
        <div className="relative hud-panel rounded-xl p-3.5 shadow-lg overflow-hidden group hover:border-orange-500/40 transition">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500/40 via-orange-400 to-transparent" />
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Events</span>
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">{metrics.active_incidents_count}</div>
          <div className="text-[10px] text-orange-300/80 mt-1 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
            Simultaneous Crises
          </div>
        </div>

        {/* Critical Incidents */}
        <div className="relative hud-panel-danger rounded-xl p-3.5 shadow-lg overflow-hidden group hover:border-red-500/60 transition">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-600 via-red-400 to-transparent" />
          <div className="flex items-center justify-between text-red-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-300">Critical Priority</span>
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertOctagon className="w-3.5 h-3.5 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-400 tracking-tight">{metrics.critical_incidents_count}</div>
          <div className="text-[10px] text-red-300/90 mt-1 font-mono">
            Score &gt; 85.0 &bull; Urgent
          </div>
        </div>

        {/* Available Ambulances */}
        <div className="relative hud-panel rounded-xl p-3.5 shadow-lg overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/40 via-emerald-400 to-transparent" />
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ambulances</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">{metrics.available_ambulances}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Ready in Reserve</div>
        </div>

        {/* Available Rescue Teams */}
        <div className="relative hud-panel rounded-xl p-3.5 shadow-lg overflow-hidden group hover:border-sky-500/40 transition">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-500/40 via-sky-400 to-transparent" />
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rescue Teams</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-400 tracking-tight">{metrics.available_rescue_teams}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Extraction Ready</div>
        </div>

        {/* Available Medical Units */}
        <div className="relative hud-panel rounded-xl p-3.5 shadow-lg overflow-hidden group hover:border-purple-500/40 transition">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/40 via-purple-400 to-transparent" />
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trauma Units</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <HeartHandshake className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-400 tracking-tight">{metrics.available_medical_units}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Mobile Surgical</div>
        </div>

        {/* Resources Assigned */}
        <div className="relative hud-panel rounded-xl p-3.5 shadow-lg overflow-hidden group hover:border-cyan-500/40 transition">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/40 via-cyan-400 to-transparent" />
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deployed Units</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-400 tracking-tight">{metrics.resources_currently_assigned}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Of {metrics.total_resources} Total Assets
          </div>
        </div>
      </div>

      {/* Main Row: Map and Active Incidents Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Visualization */}
        <div className="lg:col-span-7 hud-panel rounded-xl p-4 shadow-xl flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2 tracking-wide">
                <span>GEOSPATIAL SITUATIONAL AWARENESS</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-500/30 font-bold">
                  GPS LIVE FEED
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time incident localization, reserve staging positions, and active dispatch vectors
              </p>
            </div>
            <div className="hidden sm:flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>DYNAMIC MAPPING</span>
            </div>
          </div>
          <div className="flex-1 min-h-[440px]">
            <MapComponent
              incidents={displayedIncidents}
              resources={displayedResources}
              onSelectIncident={onSelectIncident}
            />
          </div>
        </div>

        {/* Active Incidents Quick List */}
        <div className="lg:col-span-5 hud-panel rounded-xl p-4 shadow-xl flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
                <span>PRIORITY DISPATCH QUEUE</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-500/30 font-bold">
                  {activeIncidents.length} ACTIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Ranked deterministically by severity, urgency & casualties</p>
            </div>
            <button
              onClick={() => onNavigateTab('incidents')}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold transition"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[440px] pr-1">
            {activeIncidents.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-500 font-mono">
                No active incidents. Standby posture maintained.
              </div>
            ) : (
              activeIncidents
                .slice()
                .sort((a, b) => b.priority_score - a.priority_score)
                .map((inc) => {
                  const isCritical = inc.priority_level === 'CRITICAL';
                  const isHigh = inc.priority_level === 'HIGH';
                  const isMedium = inc.priority_level === 'MEDIUM';

                  const badgeClass = isCritical
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                    : isHigh
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.2)]'
                    : isMedium
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

                  const cardBorder = isCritical
                    ? 'border-red-500/30 hover:border-red-500/60'
                    : 'border-slate-800/80 hover:border-sky-500/40';

                  return (
                    <div
                      key={inc.incident_id}
                      className={`p-3 bg-slate-950/75 border ${cardBorder} rounded-xl shadow-md transition group`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span 
                              className="text-xs font-bold text-white hover:text-sky-300 cursor-pointer transition flex items-center gap-1.5" 
                              onClick={() => onSelectIncident(inc.incident_id)}
                            >
                              {inc.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <span>📍</span> <span>{inc.location}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border shrink-0 ${badgeClass}`}>
                          {inc.priority_level} ({inc.priority_score.toFixed(1)})
                        </span>
                      </div>

                      {/* Casualty & People Affected Stats */}
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 my-1.5 bg-slate-900/60 px-2 py-1 rounded border border-slate-800/50">
                        <span>At Risk: <strong className="text-slate-200">{inc.people_affected}</strong></span>
                        <span>&bull;</span>
                        <span>Casualties: <strong className={inc.estimated_casualties > 0 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>{inc.estimated_casualties}</strong></span>
                      </div>

                      {/* Resource badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-900 text-[11px]">
                        <div className="flex items-center space-x-1 text-slate-400">
                          <span className="text-[10px]">Units:</span>
                          {inc.allocated_resources.length > 0 ? (
                            inc.allocated_resources.map((rId) => (
                              <span key={rId} className="px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-500/30 text-sky-300 font-mono text-[9px] font-bold">
                                {rId}
                              </span>
                            ))
                          ) : (
                            <span className="text-amber-400 font-semibold text-[10px] italic">Pending Replan</span>
                          )}
                        </div>

                        <button
                          onClick={() => onResolveIncident(inc.incident_id)}
                          className="text-[10px] font-medium text-slate-400 hover:text-emerald-400 px-2 py-0.5 rounded hover:bg-emerald-950/40 border border-transparent hover:border-emerald-500/30 transition"
                        >
                          Resolve & Free
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Alerts and Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tactical Alerts */}
        <div className="lg:col-span-4 hud-panel rounded-xl p-4 shadow-xl flex flex-col relative overflow-hidden">
          <div className="flex items-center space-x-2 mb-3 border-b border-slate-800/80 pb-2.5">
            <div className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-extrabold text-white tracking-wide">TACTICAL AUDIT ALERTS</h2>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px]">
            {alerts.length === 0 ? (
              <div className="text-xs text-slate-400 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>All allocations verified. Zero contention detected.</span>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-950/80 border border-amber-500/20 text-xs text-slate-300 flex items-start space-x-2.5 hover:border-amber-500/40 transition"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5 shadow-[0_0_6px_#f59e0b]" />
                  <span className="leading-snug text-slate-200">{alert}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-Time Multi-Agent Process Timeline */}
        <div className="lg:col-span-8 hud-panel rounded-xl p-4 shadow-xl flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-extrabold text-white tracking-wide">LANGGRAPH MULTI-AGENT THOUGHT & ACTION LOG</h2>
            </div>
            <button
              onClick={() => onNavigateTab('timeline')}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition"
            >
              View Full History &rarr;
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px] font-mono text-xs">
            {timeline.length === 0 ? (
              <div className="text-slate-500 py-6 text-center">Standby...</div>
            ) : (
              timeline.slice(0, 6).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-sky-500/30 transition"
                >
                  <span className="text-slate-400 text-[11px] shrink-0 font-bold">{item.timestamp}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 border ${
                    item.type.includes('replan') || item.type.includes('alert')
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : item.type.includes('priority')
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : item.type.includes('assessment')
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  }`}>
                    {item.type.replace('_', ' ')}
                  </span>
                  <span className="text-slate-200 text-xs truncate flex-1">{item.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
