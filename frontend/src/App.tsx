import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { IncidentModal } from './components/IncidentModal';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { ResponsePlanPage } from './pages/ResponsePlanPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { dashboardApi } from './api/dashboard';
import { demoApi } from './api/demo';
import { incidentsApi } from './api/incidents';
import { resourcesApi } from './api/resources';
import { responseApi } from './api/response';
import { DashboardData, IncidentCreatePayload } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-red-500/30">
      {/* Global Header */}
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error notification banner if backend is unreachable */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                <strong>Connection Error:</strong> Could not communicate with FastAPI backend ({error}).
                Verify that the backend is running on <code>http://localhost:8000</code>.
              </span>
            </div>
            <button
              onClick={refreshData}
              className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-200 rounded border border-red-500/40 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading state for initial fetch */}
        {isLoading && !dashboardData ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-slate-400 font-mono">
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

      {/* Incident Reporting Modal */}
      <IncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleCreateIncident}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-[11px] text-slate-500">
        Crisis Command &bull; Emergency Response & Resource Coordination Decision Support System &bull; Multi-Agent Hackathon Architecture
      </footer>
    </div>
  );
};

export default App;
