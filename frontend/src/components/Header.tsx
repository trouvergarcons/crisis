import React, { useState } from 'react';
import { 
  ShieldAlert, 
  RotateCcw, 
  PlayCircle, 
  AlertOctagon, 
  Wrench, 
  Activity, 
  LayoutDashboard, 
  Flame, 
  Truck, 
  FileText, 
  Clock,
  LogOut,
  UserCheck,
  Volume2,
  VolumeX,
  Layers,
  Sparkles
} from 'lucide-react';
import { UserSession } from '../types';
import { tacticalAudio } from '../utils/audio';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemHealth: {
    status: string;
    llmProvider: string;
    activeIncidents: number;
    totalResources: number;
  } | null;
  onReset: () => void;
  onLoadScenario: () => void;
  onSimulateCritical: () => void;
  onSimulateFailure: () => void;
  isActionLoading: boolean;
  onOpenReportModal: () => void;
  onOpenIAPReport?: () => void;
  onOpenScenarios?: () => void;
  session?: UserSession | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  systemHealth,
  onReset,
  onLoadScenario,
  onSimulateCritical,
  onSimulateFailure,
  isActionLoading,
  onOpenReportModal,
  onOpenIAPReport,
  onOpenScenarios,
  session,
  onLogout,
}) => {
  const [isMuted, setIsMuted] = React.useState<boolean>(tacticalAudio.getIsMuted());

  const handleToggleAudio = () => {
    const next = tacticalAudio.toggleMute();
    setIsMuted(next);
  };
  return (
    <header className="border-b border-sky-500/15 bg-slate-950/85 sticky top-0 z-50 backdrop-blur-xl shadow-2xl shadow-black/60">
      {/* Top Accent Gradient Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-red-600 via-sky-500 to-emerald-500 opacity-80" />

      {/* Top Banner: Brand and Simulation Triggers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="relative p-2.5 bg-red-600/15 border border-red-500/50 rounded-xl text-red-500 shadow-lg shadow-red-950/60 group">
              <div className="absolute inset-0 rounded-xl bg-red-500/20 blur-sm -z-10 group-hover:blur-md transition" />
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-extrabold tracking-wider text-white flex items-center gap-2">
                  CRISIS COMMAND
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.25)] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    LIVE OPS
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Multi-Agent Emergency Response & Deterministic Resource Coordination Agent
              </p>
            </div>
          </div>

          {/* Quick Simulation Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onReset}
              disabled={isActionLoading}
              title="Reset simulation environment to blank standby"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 shadow-sm transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>

            <button
              onClick={onLoadScenario}
              disabled={isActionLoading}
              title="Load standard 4-incident scenario"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-950/60 hover:bg-sky-900/60 text-sky-200 border border-sky-500/40 shadow-sm transition active:scale-95"
            >
              <PlayCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Load Scenario</span>
            </button>

            <button
              onClick={onSimulateCritical}
              disabled={isActionLoading}
              title="Simulate sudden Chemical Explosion (Priority 99) triggering dynamic replanning"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/60 border border-red-400/40 transition active:scale-95 animate-pulse hover:animate-none"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Simulate Critical Disaster</span>
            </button>

            <button
              onClick={onSimulateFailure}
              disabled={isActionLoading}
              title="Simulate unit breakdown in the field triggering reallocation"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border border-amber-500/40 shadow-sm transition active:scale-95"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Unit Failure</span>
            </button>

            <button
              onClick={onOpenReportModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition active:scale-95 ml-1"
            >
              <span>+ Report Emergency</span>
            </button>

            {onOpenScenarios && (
              <button
                onClick={onOpenScenarios}
                disabled={isActionLoading}
                title="Open Multi-Hazard Disaster Simulator"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-950/80 to-amber-950/80 hover:from-red-900/80 hover:to-amber-900/80 text-amber-300 border border-amber-500/50 shadow-sm transition active:scale-95"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Disaster Scenarios</span>
              </button>
            )}

            {onOpenIAPReport && (
              <button
                onClick={onOpenIAPReport}
                title="View & Export Official FEMA Form ICS-201 Incident Action Plan"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-500/40 shadow-sm transition active:scale-95"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>FEMA ICS-201</span>
              </button>
            )}

            {/* Tactical Audio Toggle */}
            <button
              onClick={handleToggleAudio}
              title={isMuted ? 'Unmute Tactical Voice & Radio Alerts' : 'Mute Tactical Audio'}
              className={`p-1.5 rounded-lg border transition active:scale-95 ${
                isMuted
                  ? 'bg-slate-900/80 text-slate-500 border-slate-700'
                  : 'bg-sky-950/60 text-sky-400 border-sky-500/40 shadow-[0_0_8px_rgba(56,189,248,0.25)]'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Logged in User Badge & Logout */}
            {session && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-700/80 ml-1">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                    {session.displayName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {session.role === 'super_admin'
                      ? 'SUPER ADMIN'
                      : session.role === 'dept_admin'
                      ? `${session.badgeNumber} • ADMIN`
                      : 'DISPATCHER'}
                  </span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign out of Crisis Command"
                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-white transition active:scale-95 flex items-center gap-1 text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live System Status Sub-bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <span className="flex items-center space-x-1.5 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="text-slate-200 font-mono text-[10px]">LangGraph StateGraph: CONNECTED</span>
            </span>
            <span className="text-slate-400">
              LLM Provider: <strong className="text-sky-300 font-mono uppercase">{systemHealth?.llmProvider || 'MOCK/DOMAIN-RULES'}</strong>
            </span>
            <span className="text-slate-400">
              Active Incidents: <strong className="text-amber-400 font-mono">{systemHealth?.activeIncidents ?? 0}</strong>
            </span>
            <span className="text-slate-400">
              Fleet Readiness: <strong className="text-emerald-400 font-mono">{systemHealth?.totalResources ?? 19} Units</strong>
            </span>
          </div>

          <div className="hidden sm:flex items-center text-slate-500 space-x-2 font-mono text-[10px]">
            <span className="text-slate-400">DECISION SUPPORT ACTIVE</span>
            <span>&bull;</span>
            <span className="text-emerald-400 font-semibold">100% AUDITABLE TRACE</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Command Dashboard', icon: LayoutDashboard },
          { id: 'incidents', label: 'Emergencies', icon: Flame },
          { id: 'resources', label: 'Resource Fleet', icon: Truck },
          { id: 'response', label: 'Tactical Response Plan', icon: FileText },
          { id: 'timeline', label: 'Replanning Activity Log', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-red-500 text-white bg-slate-900/80 shadow-[inset_0_-2px_8px_rgba(239,68,68,0.2)]'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
