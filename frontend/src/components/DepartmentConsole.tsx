import React, { useState } from 'react';
import { Department, UserSession, Incident, Resource } from '../types';
import { 
  Flame, 
  Ambulance, 
  LifeBuoy, 
  Radio, 
  Globe, 
  ShieldAlert, 
  Check, 
  Siren, 
  Wrench, 
  Navigation, 
  Send, 
  Activity, 
  Users, 
  Gauge, 
  CheckCircle2, 
  AlertTriangle,
  X
} from 'lucide-react';

interface DepartmentConsoleProps {
  session: UserSession;
  activeDepartment: Department;
  incidents: Incident[];
  resources: Resource[];
  onDepartmentChange: (dept: Department) => void;
  showAllAgencies: boolean;
  onToggleShowAll: () => void;
  onToggleUnitStatus: (resourceId: string) => Promise<void>;
  onDirectDispatch: (resourceId: string, incidentId: string) => Promise<void>;
}

export const DepartmentConsole: React.FC<DepartmentConsoleProps> = ({
  session,
  activeDepartment,
  incidents,
  resources,
  onDepartmentChange,
  showAllAgencies,
  onToggleShowAll,
  onToggleUnitStatus,
  onDirectDispatch,
}) => {
  const [isScrambleActive, setIsScrambleActive] = useState<boolean>(false);
  const [scrambleMessage, setScrambleMessage] = useState<string | null>(null);
  const [selectedUnitForDispatch, setSelectedUnitForDispatch] = useState<Resource | null>(null);
  const [targetIncidentId, setTargetIncidentId] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Agency branding & metadata
  const departmentMeta: Record<
    Department,
    { 
      title: string; 
      code: string; 
      color: string; 
      accentBorder: string; 
      bg: string; 
      icon: React.ReactNode; 
      specialtyTitle: string; 
      specialtyValue: string; 
      specialtySub: string;
      scrambleLabel: string;
    }
  > = {
    all: {
      title: 'Unified Multi-Agency Central Command',
      code: 'CMD-HQ',
      color: 'text-sky-300',
      accentBorder: 'border-sky-500/40',
      bg: 'bg-sky-950/40',
      icon: <Globe className="w-5 h-5 text-sky-400" />,
      specialtyTitle: 'Multi-Agency Synchronization',
      specialtyValue: '100% Interoperable',
      specialtySub: 'Full cross-agency command authority',
      scrambleLabel: 'Sound General City-Wide Scramble',
    },
    fire: {
      title: 'Fire Suppression & HazMat Division',
      code: 'FD-101',
      color: 'text-orange-300',
      accentBorder: 'border-orange-500/50',
      bg: 'bg-orange-950/40',
      icon: <Flame className="w-5 h-5 text-orange-400" />,
      specialtyTitle: 'Hydrant & HazMat Pressure',
      specialtyValue: '125 PSI Nominal',
      specialtySub: 'HazMat Foam & Thermal Suppression Ready',
      scrambleLabel: 'Sound 2nd Alarm Agency Scramble',
    },
    medical: {
      title: 'Emergency Medical & Trauma Services (EMS)',
      code: 'MED-204',
      color: 'text-red-300',
      accentBorder: 'border-red-500/50',
      bg: 'bg-red-950/40',
      icon: <Ambulance className="w-5 h-5 text-red-400" />,
      specialtyTitle: 'Trauma Triage & Bed Capacity',
      specialtyValue: '48 ICU Beds Standby',
      specialtySub: 'Mobile Trauma Resuscitation Online',
      scrambleLabel: 'Declare Mass Casualty Surge (MCI)',
    },
    rescue: {
      title: 'Disaster Search & Rescue Agency (SAR)',
      code: 'SAR-309',
      color: 'text-blue-300',
      accentBorder: 'border-blue-500/50',
      bg: 'bg-blue-950/40',
      icon: <LifeBuoy className="w-5 h-5 text-blue-400" />,
      specialtyTitle: 'Structural Extraction Index',
      specialtyValue: 'Class-4 Rigging Ready',
      specialtySub: 'Acoustic Listening & Drone Recon Active',
      scrambleLabel: 'Deploy SAR Urban Extraction Taskforce',
    },
    police: {
      title: 'Tactical Law Enforcement & Perimeter Security',
      code: 'PD-502',
      color: 'text-cyan-300',
      accentBorder: 'border-cyan-500/50',
      bg: 'bg-cyan-950/40',
      icon: <Radio className="w-5 h-5 text-cyan-400" />,
      specialtyTitle: 'Cordon & Evacuation Corridors',
      specialtyValue: '4 Perimeters Secured',
      specialtySub: 'Traffic Rerouting & Escort Patrols Deployed',
      scrambleLabel: 'Enforce Emergency Tactical Lockdown',
    },
  };

  const currentMeta = departmentMeta[activeDepartment] || departmentMeta.all;

  // Filter department units
  const isResourceInDept = (res: Resource, dept: Department): boolean => {
    if (dept === 'all') return true;
    if (dept === 'fire') return res.resource_type === 'fire_unit';
    if (dept === 'medical') return res.resource_type === 'ambulance' || res.resource_type === 'medical_unit';
    if (dept === 'rescue') return res.resource_type === 'rescue_team' || res.resource_type === 'shelter';
    if (dept === 'police') return res.resource_type === 'police_unit';
    return true;
  };

  const deptResources = resources.filter((r) => isResourceInDept(r, activeDepartment));
  const availableCount = deptResources.filter((r) => r.status === 'available').length;
  const assignedCount = deptResources.filter((r) => r.status === 'assigned').length;
  const maintenanceCount = deptResources.filter((r) => r.status === 'unavailable').length;
  const readinessPercent = deptResources.length > 0 
    ? Math.round((availableCount / deptResources.length) * 100) 
    : 100;

  // Scramble trigger
  const handleTriggerScramble = () => {
    setIsScrambleActive(true);
    setScrambleMessage(
      `ALARM ACTIVATED: ${currentMeta.title} has declared an operational scramble under Commander ${session.displayName}. All reserve assets ordered to immediate standby.`
    );
  };

  // Direct dispatch confirmation
  const handleConfirmDispatch = async () => {
    if (!selectedUnitForDispatch || !targetIncidentId) return;
    setIsDispatching(true);
    try {
      await onDirectDispatch(selectedUnitForDispatch.resource_id, targetIncidentId);
      setSelectedUnitForDispatch(null);
      setTargetIncidentId('');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className={`hud-panel rounded-2xl p-5 mb-6 shadow-2xl border ${currentMeta.accentBorder} relative overflow-hidden transition-all`}>
      {/* Decorative Corner Brackets */}
      <div className="corner-bracket-tl" />
      <div className="corner-bracket-tr" />
      <div className="corner-bracket-bl" />
      <div className="corner-bracket-br" />

      {/* Top Scramble Alarm Banner if Active */}
      {isScrambleActive && scrambleMessage && (
        <div className="mb-4 p-3 bg-red-950/90 border border-red-500 rounded-xl text-red-200 flex items-center justify-between shadow-lg shadow-red-950/60 animate-pulse">
          <div className="flex items-center space-x-2 text-xs">
            <Siren className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
            <span className="font-mono font-bold tracking-wide">{scrambleMessage}</span>
          </div>
          <button
            onClick={() => setIsScrambleActive(false)}
            className="p-1 text-red-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Agency Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800/80">
        {/* Left: Department Identity */}
        <div className="flex items-center space-x-3.5">
          <div className={`p-3.5 rounded-xl ${currentMeta.bg} border ${currentMeta.accentBorder} shadow-lg shadow-black/40`}>
            {currentMeta.icon}
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-400 shadow-sm">
                {currentMeta.code}
              </span>
              <h2 className={`text-lg font-black tracking-wide ${currentMeta.color}`}>
                {currentMeta.title}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
              <span>
                Commander: <strong className="text-white">{session.displayName}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Authorization Passkey: <strong className="font-mono text-sky-400 font-bold">{session.badgeNumber}</strong>
              </span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                DIRECT DISPATCH ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Right: Agency Scramble & Mutual Aid Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Emergency Scramble Button */}
          <button
            onClick={handleTriggerScramble}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-950/60 border border-red-400/40 transition active:scale-95"
          >
            <Siren className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{currentMeta.scrambleLabel}</span>
          </button>

          {/* Mutual Aid Toggle */}
          <button
            onClick={onToggleShowAll}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border shadow-md transition active:scale-95 ${
              showAllAgencies
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                showAllAgencies ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-500'
              }`}
            >
              {showAllAgencies && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span>Include Mutual Aid Agencies</span>
          </button>

          {/* Quick Agency Switcher */}
          <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-xl p-1 text-[11px]">
            <span className="text-[10px] font-bold text-slate-400 px-2 font-mono">AGENCY:</span>
            {(['all', 'fire', 'medical', 'rescue', 'police'] as Department[]).map((dept) => {
              const isSelected = activeDepartment === dept;
              return (
                <button
                  key={dept}
                  onClick={() => onDepartmentChange(dept)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {dept === 'all' ? 'All' : dept === 'fire' ? 'Fire' : dept === 'medical' ? 'EMS' : dept === 'rescue' ? 'SAR' : 'Police'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Middle Row: Specialized Agency Telemetry KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {/* Readiness Integrity */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="font-mono font-bold uppercase">Fleet Readiness</span>
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white">{readinessPercent}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all"
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
        </div>

        {/* Assigned Deployments */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="font-mono font-bold uppercase">Active Operations</span>
            <Activity className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-black text-sky-300">
            {assignedCount} <span className="text-xs text-slate-400 font-normal">/ {deptResources.length} Units</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">{availableCount} in Ready Reserve</p>
        </div>

        {/* Ready Reserves */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="font-mono font-bold uppercase">Apparatus in Staging</span>
            <Users className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-300">{availableCount} Ready</div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            {maintenanceCount > 0 ? `${maintenanceCount} In Maintenance` : '100% Operational'}
          </p>
        </div>

        {/* Branch Specialized KPI */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="font-mono font-bold uppercase truncate">{currentMeta.specialtyTitle}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base font-black text-cyan-300 truncate">{currentMeta.specialtyValue}</div>
          <p className="text-[10px] text-slate-400 mt-1 truncate font-mono">{currentMeta.specialtySub}</p>
        </div>
      </div>

      {/* Bottom Section: Dedicated Department Apparatus Roster & Direct Action Controls */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-black text-slate-200 uppercase tracking-wider">
              {currentMeta.title} &bull; Field Apparatus Control Roster
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-800">
              {deptResources.length} Units Under Jurisdiction
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            Direct Unit Dispatch & Maintenance Override
          </span>
        </div>

        {deptResources.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 font-mono">
            No apparatus found for this department branch.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {deptResources.map((unit) => {
              const isAvailable = unit.status === 'available';
              const isAssigned = unit.status === 'assigned';
              const isMaintenance = unit.status === 'unavailable';

              const statusColor = isAvailable
                ? 'text-emerald-400 bg-emerald-950/70 border-emerald-500/40'
                : isAssigned
                ? 'text-sky-300 bg-sky-950/70 border-sky-500/40'
                : 'text-amber-400 bg-amber-950/70 border-amber-500/40';

              return (
                <div
                  key={unit.resource_id}
                  className="p-3 bg-slate-950/80 border border-slate-800/90 rounded-xl shadow-md hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-xs font-bold text-white tracking-wide block">
                          {unit.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          📍 {unit.location}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${statusColor}`}>
                        {unit.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 my-2 bg-slate-900/60 p-1.5 rounded">
                      <span>ID: <strong className="text-slate-200">{unit.resource_id}</strong></span>
                      <span>Type: <strong className="text-sky-300">{unit.resource_type}</strong></span>
                      {unit.assigned_incident_id && (
                        <span>Call: <strong className="text-red-400">{unit.assigned_incident_id}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Unit Action Controls */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-900">
                    {/* Direct Dispatch Button */}
                    <button
                      onClick={() => {
                        setSelectedUnitForDispatch(unit);
                        setTargetIncidentId(incidents[0]?.incident_id || '');
                      }}
                      className="flex-1 py-1 px-2.5 rounded bg-sky-600/80 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
                    >
                      <Send className="w-3 h-3" />
                      <span>Direct Dispatch</span>
                    </button>

                    {/* Toggle Maintenance / Ready Status Button */}
                    <button
                      onClick={() => onToggleUnitStatus(unit.resource_id)}
                      title={isMaintenance ? 'Return to Ready Reserve' : 'Set unit to Maintenance'}
                      className={`p-1.5 rounded text-[11px] font-semibold border transition active:scale-95 ${
                        isMaintenance
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                          : 'bg-slate-900 border-slate-750 text-slate-400 hover:text-amber-300 hover:border-amber-500/40'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Direct Dispatch Modal */}
      {selectedUnitForDispatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative hud-panel rounded-2xl max-w-lg w-full p-6 border border-sky-500/40 shadow-2xl">
            <div className="corner-bracket-tl" />
            <div className="corner-bracket-tr" />
            <div className="corner-bracket-bl" />
            <div className="corner-bracket-br" />

            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Direct Dispatch Order: {selectedUnitForDispatch.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedUnitForDispatch(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Select an active emergency scene to mobilize <strong>{selectedUnitForDispatch.name} ({selectedUnitForDispatch.resource_id})</strong> under Department Command authority:
            </p>

            <div className="space-y-2 mb-5 max-h-[240px] overflow-y-auto pr-1">
              {incidents
                .filter((inc) => inc.status !== 'resolved')
                .map((inc) => {
                  const isSelected = targetIncidentId === inc.incident_id;
                  const isCritical = inc.priority_level === 'CRITICAL';
                  return (
                    <div
                      key={inc.incident_id}
                      onClick={() => setTargetIncidentId(inc.incident_id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-950/80 border-sky-400 shadow-md text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{inc.title}</span>
                          {isCritical && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-500/40 rounded">
                              CRITICAL
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">📍 {inc.location}</div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {inc.incident_id}
                      </span>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedUnitForDispatch(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispatch}
                disabled={isDispatching || !targetIncidentId}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-950/60 transition active:scale-95 flex items-center gap-2"
              >
                {isDispatching ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting Dispatch Code...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Authorize & Deploy Apparatus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
