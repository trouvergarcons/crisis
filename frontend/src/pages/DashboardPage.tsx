import React from 'react';
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
import { DashboardData, Incident, Resource } from '../types';
import { MapComponent } from '../components/MapComponent';
import { ReplanningBanner } from '../components/ReplanningBanner';

interface DashboardPageProps {
  data: DashboardData;
  onSelectIncident: (id: string) => void;
  onApproval: (action: 'approve' | 'reject' | 'review', notes?: string) => Promise<void>;
  onNavigateTab: (tab: string) => void;
  onResolveIncident: (id: string) => Promise<void>;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  onSelectIncident,
  onApproval,
  onNavigateTab,
  onResolveIncident,
}) => {
  const { metrics, incidents, resources, last_replan_event, alerts, timeline } = data;
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');

  return (
    <div className="space-y-6">
      {/* Replanning Banner (if triggered) */}
      <ReplanningBanner
        replanEvent={last_replan_event || null}
        onApproval={onApproval}
        approvalStatus={metrics.approval_status}
      />

      {/* Top 6 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Active Incidents */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Events</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.active_incidents_count}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            Simultaneous disasters
          </div>
        </div>

        {/* Critical Incidents */}
        <div className="bg-slate-900 border border-red-500/30 rounded-xl p-3.5 shadow-sm hover:border-red-500/50 transition">
          <div className="flex items-center justify-between text-red-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Critical</span>
            <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-red-400">{metrics.critical_incidents_count}</div>
          <div className="text-[11px] text-red-300/80 mt-1">
            Priority score &gt; 85.0
          </div>
        </div>

        {/* Available Ambulances */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Ambulances</span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{metrics.available_ambulances}</div>
          <div className="text-[11px] text-slate-400 mt-1">Free / Ready reserve</div>
        </div>

        {/* Available Rescue Teams */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Rescue Teams</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{metrics.available_rescue_teams}</div>
          <div className="text-[11px] text-slate-400 mt-1">Extraction ready</div>
        </div>

        {/* Available Medical Units */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Medical Units</span>
            <HeartHandshake className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{metrics.available_medical_units}</div>
          <div className="text-[11px] text-slate-400 mt-1">Mobile trauma units</div>
        </div>

        {/* Resources Assigned */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Units Assigned</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">{metrics.resources_currently_assigned}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Of {metrics.total_resources} total field units
          </div>
        </div>
      </div>

      {/* Main Row: Map and Active Incidents Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Visualization */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Field Operations Tactical Map</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  LEAFLET / OSM
                </span>
              </h2>
              <p className="text-xs text-slate-400">Live spatial positioning of emergencies and assigned response units</p>
            </div>
          </div>
          <div className="flex-1 min-h-[380px]">
            <MapComponent
              incidents={incidents}
              resources={resources}
              onSelectIncident={onSelectIncident}
            />
          </div>
        </div>

        {/* Active Incidents Quick List */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Active Priority Triage</h2>
              <p className="text-xs text-slate-400">Ranked by deterministic multi-factor priority score</p>
            </div>
            <button
              onClick={() => onNavigateTab('incidents')}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-medium transition"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {activeIncidents.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
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
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : isHigh
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    : isMedium
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

                  return (
                    <div
                      key={inc.incident_id}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white hover:text-red-400 cursor-pointer" onClick={() => onSelectIncident(inc.incident_id)}>
                              {inc.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            📍 {inc.location}
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border shrink-0 ${badgeClass}`}>
                          {inc.priority_level} ({inc.priority_score})
                        </span>
                      </div>

                      {/* Resource badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-900 text-[11px]">
                        <div className="flex items-center space-x-1 text-slate-400">
                          <span>Units:</span>
                          {inc.allocated_resources.length > 0 ? (
                            inc.allocated_resources.map((rId) => (
                              <span key={rId} className="px-1.5 py-0.2 rounded bg-slate-800 text-blue-300 font-mono text-[10px]">
                                {rId}
                              </span>
                            ))
                          ) : (
                            <span className="text-amber-400 italic">Deficit / Pending</span>
                          )}
                        </div>

                        <button
                          onClick={() => onResolveIncident(inc.incident_id)}
                          className="text-[10px] text-slate-400 hover:text-emerald-400 transition"
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
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Live System Alerts</h2>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px]">
            {alerts.length === 0 ? (
              <div className="text-xs text-slate-500 p-3 bg-slate-950/40 rounded border border-slate-800/60">
                All allocations verified. Zero tactical conflicts detected.
              </div>
            ) : (
              alerts.slice(0, 5).map((alert, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start space-x-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span className="leading-snug">{alert}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-Time Multi-Agent Process Timeline */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white">Multi-Agent Workflow Activity Log</h2>
            </div>
            <button
              onClick={() => onNavigateTab('timeline')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition"
            >
              View Full History
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px] font-mono text-xs">
            {timeline.length === 0 ? (
              <div className="text-slate-500 py-6 text-center">Standby...</div>
            ) : (
              timeline.slice(0, 6).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-2 rounded bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 transition"
                >
                  <span className="text-slate-500 text-[11px] shrink-0">{item.timestamp}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold shrink-0 ${
                    item.type.includes('replan') || item.type.includes('alert')
                      ? 'bg-red-500/20 text-red-400'
                      : item.type.includes('priority')
                      ? 'bg-amber-500/20 text-amber-400'
                      : item.type.includes('assessment')
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {item.type.replace('_', ' ')}
                  </span>
                  <span className="text-slate-300 text-xs truncate flex-1">{item.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
