import React, { useState } from 'react';
import { 
  Truck, 
  Shield, 
  HeartPulse, 
  Flame, 
  Radio, 
  Home, 
  MapPin, 
  AlertCircle, 
  Wrench, 
  CheckCircle2 
} from 'lucide-react';
import { Resource, ResourceType } from '../types';

interface ResourcesPageProps {
  resources: Resource[];
  onMarkUnavailable: (id: string) => Promise<void>;
  onReplan: () => Promise<void>;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = ({
  resources,
  onMarkUnavailable,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const resourceGroups: { type: ResourceType; label: string; icon: React.ElementType }[] = [
    { type: 'ambulance', label: 'Ambulances', icon: Truck },
    { type: 'rescue_team', label: 'Rescue Teams', icon: Shield },
    { type: 'medical_unit', label: 'Medical Units', icon: HeartPulse },
    { type: 'fire_unit', label: 'Fire Units', icon: Flame },
    { type: 'police_unit', label: 'Police Units', icon: Radio },
    { type: 'shelter', label: 'Emergency Shelters', icon: Home },
  ];

  const handleToggleUnavailable = async (id: string) => {
    setActionLoadingId(id);
    try {
      await onMarkUnavailable(id);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredResources = resources.filter((r) => {
    if (filterType !== 'ALL' && r.resource_type !== filterType) return false;
    if (filterStatus === 'AVAILABLE' && r.status !== 'available') return false;
    if (filterStatus === 'ASSIGNED' && r.status !== 'assigned') return false;
    if (filterStatus === 'UNAVAILABLE' && r.status !== 'unavailable') return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Controls / Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Category:</span>
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                filterType === 'ALL'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ALL
            </button>
            {resourceGroups.map((g) => (
              <button
                key={g.type}
                onClick={() => setFilterType(g.type)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  filterType === g.type
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Status:</span>
            {['ALL', 'AVAILABLE', 'ASSIGNED', 'UNAVAILABLE'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  filterStatus === st
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong>{filteredResources.length}</strong> of {resources.length} fleet units
        </div>
      </div>

      {/* Grid of Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((res) => {
          const isUnavailable = res.status === 'unavailable';
          const isAssigned = res.status === 'assigned';

          const statusColor = isUnavailable
            ? 'bg-slate-800 text-slate-400 border-slate-700'
            : isAssigned
            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

          const group = resourceGroups.find((g) => g.type === res.resource_type);
          const Icon = group?.icon || Truck;

          return (
            <div
              key={res.resource_id}
              className={`bg-slate-900 border rounded-xl p-4 shadow-sm transition flex flex-col justify-between ${
                isUnavailable
                  ? 'border-slate-800 opacity-70'
                  : isAssigned
                  ? 'border-blue-500/40 hover:border-blue-500/60'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-blue-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">{res.name}</h4>
                      <span className="text-[11px] font-mono text-slate-400 uppercase">
                        {res.resource_id}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border uppercase ${statusColor}`}>
                    {res.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 mt-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{res.location}</span>
                  </div>

                  {res.capacity && (
                    <div className="text-[11px] text-slate-400">
                      Capacity: <strong>{res.capacity} persons</strong>
                    </div>
                  )}

                  <div className="mt-2 p-2 rounded bg-slate-950/70 border border-slate-800/80 text-[11px]">
                    <span className="text-slate-500 uppercase text-[10px] block font-semibold">
                      Current Assignment
                    </span>
                    {res.assigned_incident_id ? (
                      <span className="text-blue-400 font-semibold">
                        Assigned to {res.assigned_incident_id}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium">Unassigned Reserve</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {res.latitude.toFixed(3)}, {res.longitude.toFixed(3)}
                </span>

                <button
                  onClick={() => handleToggleUnavailable(res.resource_id)}
                  disabled={actionLoadingId === res.resource_id}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                    isUnavailable
                      ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30'
                      : 'bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{isUnavailable ? 'Restore Unit' : 'Simulate Failure'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
