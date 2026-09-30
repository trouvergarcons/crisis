import React, { useState } from 'react';
import { 
  Flame, 
  MapPin, 
  Users, 
  Heart, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle, 
  Plus, 
  Info, 
  Sliders, 
  Truck 
} from 'lucide-react';
import { Incident, PriorityLevel } from '../types';

interface IncidentsPageProps {
  incidents: Incident[];
  onAssess: (id: string) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
  onReplan: () => Promise<void>;
  onOpenReportModal: () => void;
  selectedIncidentId?: string | null;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  incidents,
  onAssess,
  onResolve,
  onReplan,
  onOpenReportModal,
  selectedIncidentId,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [expandedFactorId, setExpandedFactorId] = useState<string | null>(null);

  const filteredIncidents = incidents.filter((inc) => {
    if (filterLevel !== 'ALL' && inc.priority_level !== filterLevel) return false;
    if (filterStatus === 'ACTIVE' && inc.status === 'resolved') return false;
    if (filterStatus === 'RESOLVED' && inc.status !== 'resolved') return false;
    return true;
  });

  const handleAction = async (id: string, actionFn: (id: string) => Promise<void>) => {
    setActionLoadingId(id);
    try {
      await actionFn(id);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Priority:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  filterLevel === lvl
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Status:</span>
            {['ACTIVE', 'RESOLVED', 'ALL'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  filterStatus === st
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onOpenReportModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Report Emergency</span>
        </button>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredIncidents.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
            No incidents matching current filters.
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isCritical = inc.priority_level === 'CRITICAL';
            const isHigh = inc.priority_level === 'HIGH';
            const isMedium = inc.priority_level === 'MEDIUM';

            const borderClass = isCritical
              ? 'border-red-500/50 shadow-red-950/20'
              : isHigh
              ? 'border-orange-500/40'
              : isMedium
              ? 'border-yellow-500/30'
              : 'border-slate-800';

            const badgeColor = isCritical
              ? 'bg-red-500/20 text-red-300 border-red-500/40'
              : isHigh
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
              : isMedium
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

            const isSelected = selectedIncidentId === inc.incident_id;

            return (
              <div
                key={inc.incident_id}
                className={`bg-slate-900 border ${borderClass} ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                } rounded-xl p-5 shadow-lg flex flex-col justify-between transition hover:border-slate-700`}
              >
                <div>
                  {/* Top line: Category, Priority Badge, Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono uppercase text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {inc.incident_type.replace('_', ' ')} • {inc.incident_id}
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                        {inc.priority_level} ({inc.priority_score})
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                        {inc.status}
                      </span>
                    </div>
                  </div>

                  {/* Title and location */}
                  <h3 className="text-base font-bold text-white tracking-tight">{inc.title}</h3>
                  <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{inc.location}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                    {inc.description}
                  </p>

                  {/* Metrics bar: Severity, Urgency, People, Casualties */}
                  <div className="grid grid-cols-4 gap-2 my-3 py-2 border-y border-slate-800/80 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Severity</span>
                      <span className="text-xs font-bold text-red-400">{inc.severity} / 10</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Urgency</span>
                      <span className="text-xs font-bold text-amber-400">{inc.urgency} / 10</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">At Risk</span>
                      <span className="text-xs font-bold text-blue-400 flex items-center justify-center gap-0.5">
                        <Users className="w-3 h-3" />
                        {inc.people_affected}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Casualties</span>
                      <span className="text-xs font-bold text-purple-400 flex items-center justify-center gap-0.5">
                        <Heart className="w-3 h-3" />
                        {inc.estimated_casualties}
                      </span>
                    </div>
                  </div>

                  {/* Resources: Required vs Allocated */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-slate-400 flex items-center justify-between">
                      <span className="font-semibold text-slate-300">Required Resources:</span>
                      <span className="font-mono text-[11px]">
                        {Object.entries(inc.required_resources).map(([t, q]) => `${q} ${t.replace('_', ' ')}`).join(', ') || 'None specified'}
                      </span>
                    </div>

                    <div className="text-slate-400 flex items-center justify-between">
                      <span className="font-semibold text-slate-300">Allocated Units:</span>
                      <div className="flex flex-wrap gap-1">
                        {inc.allocated_resources.length > 0 ? (
                          inc.allocated_resources.map((rId) => (
                            <span key={rId} className="px-1.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 font-mono text-[10px] rounded">
                              {rId}
                            </span>
                          ))
                        ) : (
                          <span className="text-red-400 italic text-[11px]">No units deployed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Assessment / Rationale note */}
                  {inc.assessment_explanation && (
                    <div className="mt-3 text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
                      <div className="font-semibold text-slate-400 uppercase text-[10px] flex items-center gap-1 mb-0.5">
                        <ShieldAlert className="w-3 h-3 text-blue-400" />
                        Agent Assessment Summary
                      </div>
                      {inc.assessment_explanation}
                    </div>
                  )}

                  {/* Transparent Priority Factor Breakdown */}
                  {inc.priority_factors && (
                    <div className="mt-2">
                      <button
                        onClick={() =>
                          setExpandedFactorId(expandedFactorId === inc.incident_id ? null : inc.incident_id)
                        }
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <Info className="w-3 h-3" />
                        <span>{expandedFactorId === inc.incident_id ? 'Hide Priority Math' : 'Show Deterministic Priority Scoring Factors'}</span>
                      </button>

                      {expandedFactorId === inc.incident_id && (
                        <div className="mt-2 p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                          <div>Severity Component: {inc.priority_factors.severity_score}%</div>
                          <div>Urgency Component: {inc.priority_factors.urgency_score}%</div>
                          <div>Population Risk Component: {inc.priority_factors.people_score}%</div>
                          <div>Hazard Bonus: +{inc.priority_factors.type_hazard_bonus} pts</div>
                          {inc.priority_factors.explanation && (
                            <p className="text-slate-400 italic font-sans mt-1 pt-1 border-t border-slate-900">
                              {inc.priority_factors.explanation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleAction(inc.incident_id, onAssess)}
                    disabled={actionLoadingId === inc.incident_id}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoadingId === inc.incident_id ? 'animate-spin' : ''}`} />
                    <span>Re-Assess</span>
                  </button>

                  <button
                    onClick={onReplan}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Replan Fleet</span>
                  </button>

                  {inc.status !== 'resolved' && (
                    <button
                      onClick={() => handleAction(inc.incident_id, onResolve)}
                      disabled={actionLoadingId === inc.incident_id}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Resolve & Free</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
