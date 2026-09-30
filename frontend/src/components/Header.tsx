import React from 'react';
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
  Clock 
} from 'lucide-react';

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
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-50 backdrop-blur-md">
      {/* Top Banner: Brand and Simulation Triggers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-600/20 border border-red-500/40 rounded-xl text-red-500 shadow-lg shadow-red-950/40">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  CRISIS COMMAND
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    LIVE SYSTEM
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
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
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={onLoadScenario}
              disabled={isActionLoading}
              title="Load standard 4-incident scenario"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition"
            >
              <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Load Scenario</span>
            </button>

            <button
              onClick={onSimulateCritical}
              disabled={isActionLoading}
              title="Simulate sudden Chemical Explosion (Priority 99) triggering dynamic replanning"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/30 transition animate-pulse hover:animate-none"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Simulate New Critical Emergency</span>
            </button>

            <button
              onClick={onSimulateFailure}
              disabled={isActionLoading}
              title="Simulate unit breakdown in the field triggering reallocation"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Resource Failure</span>
            </button>

            <button
              onClick={onOpenReportModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition ml-1"
            >
              <span>+ Report Incident</span>
            </button>
          </div>
        </div>

        {/* Live System Status Sub-bar */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-slate-300 font-mono">FastAPI + LangGraph: CONNECTED</span>
            </span>
            <span>
              LLM Provider: <strong className="text-slate-200 uppercase">{systemHealth?.llmProvider || 'MOCK/DOMAIN-RULES'}</strong>
            </span>
            <span>
              Active Incidents: <strong className="text-amber-400">{systemHealth?.activeIncidents ?? 0}</strong>
            </span>
            <span>
              Total Units: <strong className="text-blue-400">{systemHealth?.totalResources ?? 19}</strong>
            </span>
          </div>

          <div className="hidden sm:flex items-center text-slate-500 space-x-2">
            <span>Decision Support System</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">Deterministic Logic Active</span>
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
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-red-500 text-white bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
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
