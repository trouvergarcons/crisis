import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { IncidentModal } from './components/IncidentModal';
import { IAPReportModal } from './components/IAPReportModal';
import { ScenarioDrawer } from './components/ScenarioDrawer';
import { TacticalRadioBar } from './components/TacticalRadioBar';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { ResponsePlanPage } from './pages/ResponsePlanPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { LoginPage } from './pages/LoginPage';
import { TacticalBackground3D } from './components/TacticalBackground3D';
import { dashboardApi } from './api/dashboard';
import { demoApi } from './api/demo';
import { incidentsApi } from './api/incidents';
import { resourcesApi } from './api/resources';
import { responseApi } from './api/response';
import { DashboardData, IncidentCreatePayload, UserSession, Department } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  // Authentication & Department session state
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('crisis_command_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isWarping, setIsWarping] = useState<boolean>(false);
  const [pendingSession, setPendingSession] = useState<UserSession | null>(null);

  const [departmentFilter, setDepartmentFilter] = useState<Department>(() => {
    return session?.department || 'all';
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [systemHealth, setSystemHealth] = useState<{
    status: string;
    llmProvider: string;
    activeIncidents: number;
    totalResources: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isIAPModalOpen, setIsIAPModalOpen] = useState<boolean>(false);
  const [isScenarioDrawerOpen, setIsScenarioDrawerOpen] = useState<boolean>(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Fetch full state from FastAPI
  const refreshData = useCallback(async () => {
    try {
      const [data, health] = await Promise.all([
        dashboardApi.get(),
        dashboardApi.checkHealth().catch(() => null),
      ]);
      setDashboardData(data);
      if (health) {
        setSystemHealth({
          status: health.status,
          llmProvider: health.llm_provider,
          activeIncidents: health.active_incidents,
          totalResources: health.total_resources,
        });
      }
      setError(null);
    } catch (err: unknown) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Backend connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    // Heartbeat sync every 6 seconds to keep dashboard real-time
    const interval = setInterval(refreshData, 6000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Demo simulation handlers
  const handleReset = async () => {
    setIsActionLoading(true);
    try {
      await demoApi.reset();
      await refreshData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLoadScenario = async () => {
    setIsActionLoading(true);
    try {
      await demoApi.loadScenario();
      await refreshData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Load scenario failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSimulateCritical = async () => {
    setIsActionLoading(true);
    try {
      await demoApi.simulateCriticalIncident();
      await refreshData();
      setActiveTab('dashboard');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Simulate critical failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSimulateFailure = async () => {
    setIsActionLoading(true);
    try {
      await demoApi.simulateResourceFailure();
      await refreshData();
      setActiveTab('dashboard');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Simulate failure failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAssessIncident = async (id: string) => {
    await incidentsApi.assess(id);
    await refreshData();
  };

  const handleResolveIncident = async (id: string) => {
    await incidentsApi.resolve(id);
    await refreshData();
  };

  const handleMarkResourceUnavailable = async (id: string) => {
    await resourcesApi.markUnavailable(id);
    await refreshData();
  };

  const handleToggleResourceStatus = async (id: string) => {
    try {
      await resourcesApi.toggleStatus(id);
      await refreshData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Toggle status failed');
    }
  };

  const handleDirectDispatch = async (resourceId: string, incidentId: string) => {
    try {
      await resourcesApi.dispatch(resourceId, incidentId);
      await refreshData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Direct dispatch failed');
    }
  };

  const handleApproval = async (action: 'approve' | 'reject' | 'review', notes?: string) => {
    await responseApi.handleApproval(action, notes);
    await refreshData();
  };

  const handleReplan = async () => {
    setIsActionLoading(true);
    try {
      await responseApi.replan();
      await refreshData();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateIncident = async (payload: IncidentCreatePayload) => {
    await incidentsApi.create(payload);
    await refreshData();
    setActiveTab('incidents');
  };

  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id);
    setActiveTab('incidents');
  };

  const handleLoginInitiate = (userSession: UserSession) => {
    setPendingSession(userSession);
    setIsWarping(true);
  };

  const handleWarpComplete = () => {
    if (pendingSession) {
      setSession(pendingSession);
      setDepartmentFilter(pendingSession.department);
      try {
        localStorage.setItem('crisis_command_session', JSON.stringify(pendingSession));
      } catch (e) {
        console.error('Failed to save session:', e);
      }
    }
    setIsWarping(false);
    setPendingSession(null);
  };

  const handleLogout = () => {
    setSession(null);
    setPendingSession(null);
    setIsWarping(false);
    try {
      localStorage.removeItem('crisis_command_session');
    } catch (e) {
      console.error('Failed to remove session:', e);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-red-500/30 overflow-x-hidden">
      {/* 3D WebGL Tactical Background Scene (Active on Login AND Post-Login with Warp Animation) */}
      <TacticalBackground3D
        isLoggedIn={!!session}
        isWarping={isWarping}
        onWarpComplete={handleWarpComplete}
      />

      {/* Background Decorative Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Subtle cybernetic dot matrix grid */}
        <div className="absolute inset-0 bg-tactical-grid opacity-50" />
        
        {/* Top-center tactical blue/cyan glow */}
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-sky-500/15 via-indigo-600/10 to-transparent blur-3xl rounded-full" />
        
        {/* Top-left emergency crimson glow */}
        <div className="absolute top-0 left-0 w-[550px] h-[550px] bg-red-600/10 blur-[130px] rounded-full" />
        
        {/* Bottom-right emerald/cyan operations glow */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-600/10 blur-[140px] rounded-full" />
        
        {/* Subtle top scanline accent border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />
      </div>

      {/* If Unauthenticated, Render Sleek Single-ID Login Floating in front of 3D Scene */}
      {!session ? (
        <LoginPage onLogin={handleLoginInitiate} isWarping={isWarping} />
      ) : (
        <>
          {/* Global Header */}
          <div className="relative z-10">
            <Header
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              systemHealth={systemHealth}
              onReset={handleReset}
              onLoadScenario={handleLoadScenario}
              onSimulateCritical={handleSimulateCritical}
              onSimulateFailure={handleSimulateFailure}
              isActionLoading={isActionLoading}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onOpenIAPReport={() => setIsIAPModalOpen(true)}
              onOpenScenarios={() => setIsScenarioDrawerOpen(true)}
              session={session}
              onLogout={handleLogout}
            />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error notification banner if backend is unreachable */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 flex items-center justify-between text-xs backdrop-blur-md shadow-lg shadow-red-950/40">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                <strong>Connection Error:</strong> Could not communicate with FastAPI backend ({error}).
                Verify that the backend is running on <code>http://localhost:8000</code>.
              </span>
            </div>
            <button
              onClick={refreshData}
              className="px-3 py-1 bg-red-600/40 hover:bg-red-600/60 text-red-100 rounded border border-red-500/50 flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading state for initial fetch */}
        {isLoading && !dashboardData ? (
          <div className="py-24 text-center">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-sky-500/30 animate-ping" />
              <div className="w-12 h-12 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">
              Connecting to Crisis Command Multi-Agent System...
            </p>
          </div>
        ) : dashboardData ? (
          <>
            {activeTab === 'dashboard' && (
              <DashboardPage
                data={dashboardData}
                onSelectIncident={handleSelectIncident}
                onApproval={handleApproval}
                onNavigateTab={setActiveTab}
                onResolveIncident={handleResolveIncident}
                session={session}
                departmentFilter={departmentFilter}
                onDepartmentFilterChange={setDepartmentFilter}
                onToggleUnitStatus={handleToggleResourceStatus}
                onDirectDispatch={handleDirectDispatch}
              />
            )}

            {activeTab === 'incidents' && (
              <IncidentsPage
                incidents={dashboardData.incidents}
                onAssess={handleAssessIncident}
                onResolve={handleResolveIncident}
                onReplan={handleReplan}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                selectedIncidentId={selectedIncidentId}
              />
            )}

            {activeTab === 'resources' && (
              <ResourcesPage
                resources={dashboardData.resources}
                onMarkUnavailable={handleMarkResourceUnavailable}
                onReplan={handleReplan}
              />
            )}

            {activeTab === 'response' && (
              <ResponsePlanPage
                plan={dashboardData.response_plan || null}
                onRefreshPlan={async () => {
                  await responseApi.generatePlan();
                  await refreshData();
                }}
                onApproval={handleApproval}
              />
            )}

            {activeTab === 'timeline' && (
              <ActivityLogPage
                timeline={dashboardData.timeline}
                onRefresh={refreshData}
              />
            )}
          </>
        ) : null}
      </main>

        {/* High-Tech Tactical Footer */}
        <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md py-4 text-center text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between px-6 max-w-7xl mx-auto w-full gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-slate-300">SYSTEM READY &bull; AUTONOMOUS DISPATCH ORCHESTRATION</span>
          </div>
          <div className="text-slate-500 font-mono text-[10px]">
            CRISIS COMMAND &bull; MULTI-AGENT STATEGRAPH &bull; DETERMINISTIC ALLOCATION
          </div>
        </footer>
        </>
      )}

      {/* Tactical AI Radio / Voice Command Bar */}
      {session && (
        <TacticalRadioBar
          onRefreshData={refreshData}
          onSelectIncident={handleSelectIncident}
        />
      )}

      {/* Incident Reporting Modal */}
      {isReportModalOpen && (
        <IncidentModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleCreateIncident}
        />
      )}

      {/* FEMA Form ICS-201 Incident Action Plan Modal */}
      {isIAPModalOpen && dashboardData && (
        <IAPReportModal
          isOpen={isIAPModalOpen}
          onClose={() => setIsIAPModalOpen(false)}
          data={dashboardData}
          session={session}
        />
      )}

      {/* Multi-Hazard Disaster Simulator Drawer */}
      {isScenarioDrawerOpen && (
        <ScenarioDrawer
          isOpen={isScenarioDrawerOpen}
          onClose={() => setIsScenarioDrawerOpen(false)}
          onScenarioInjected={refreshData}
        />
      )}
    </div>
  );
};

export default App;
