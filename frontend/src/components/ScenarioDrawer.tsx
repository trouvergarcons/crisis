import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Waves, 
  Building2, 
  Zap, 
  Skull, 
  X, 
  Play, 
  Activity,
  CheckCircle2
} from 'lucide-react';
import { demoApi } from '../api/demo';
import { tacticalAudio } from '../utils/audio';

interface ScenarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioInjected: () => Promise<void>;
}

export const ScenarioDrawer: React.FC<ScenarioDrawerProps> = ({
  isOpen,
  onClose,
  onScenarioInjected,
}) => {
  const [injectingScenario, setInjectingScenario] = useState<string | null>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'chemical',
      title: 'Chemical Tanker Explosion',
      category: 'HAZMAT CRITICAL',
      severity: '10/10',
      casualties: 18,
      icon: <Skull className="w-5 h-5 text-red-400" />,
      color: 'border-red-500/40 hover:border-red-500 bg-red-950/20 hover:bg-red-950/40',
      badge: 'bg-red-950 text-red-400 border-red-500/40',
      description: 'Catastrophic hazmat detonation at Industrial Port. Toxic vapor cloud requires immediate multi-station foam preemption.',
      actionText: 'Inject Chemical Detonation',
    },
    {
      id: 'earthquake',
      title: '7.1 Richter Earthquake',
      category: 'MASS COLLAPSE',
      severity: '10/10',
      casualties: 28,
      icon: <Building2 className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/40 hover:border-amber-500 bg-amber-950/20 hover:bg-amber-950/40',
      badge: 'bg-amber-950 text-amber-400 border-amber-500/40',
      description: 'Seismic shock collapses 2 commercial high-rises in Financial District. Structural rigging and heavy SAR mobilization needed.',
      actionText: 'Inject 7.1 Seismic Shock',
    },
    {
      id: 'flood',
      title: 'Flash Flood & Basin Inundation',
      category: 'WATER RESCUE',
      severity: '8/10',
      casualties: 6,
      icon: <Waves className="w-5 h-5 text-sky-400" />,
      color: 'border-sky-500/40 hover:border-sky-500 bg-sky-950/20 hover:bg-sky-950/40',
      badge: 'bg-sky-950 text-sky-400 border-sky-500/40',
      description: 'Storm surge breaches seawall, trapping 45 transit commuters on subway concourses. Deploy water rescue teams & temporary shelters.',
      actionText: 'Inject Flash Flood Surge',
    },
    {
      id: 'wildfire',
      title: 'Wildfire Hills Evacuation Front',
      category: 'URBAN INTERFACE',
      severity: '9/10',
      casualties: 8,
      icon: <Flame className="w-5 h-5 text-orange-400" />,
      color: 'border-orange-500/40 hover:border-orange-500 bg-orange-950/20 hover:bg-orange-950/40',
      badge: 'bg-orange-950 text-orange-400 border-orange-500/40',
      description: 'Gale winds drive wildfire front across residential hills. Perimeter cordons and multi-engine firelines deployed.',
      actionText: 'Inject Wildfire Firefront',
    },
    {
      id: 'blackout',
      title: 'Regional Grid Collapse & ICU Failure',
      category: 'INFRASTRUCTURE',
      severity: '9/10',
      casualties: 12,
      icon: <Zap className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/40 hover:border-purple-500 bg-purple-950/20 hover:bg-purple-950/40',
      badge: 'bg-purple-950 text-purple-400 border-purple-500/40',
      description: 'Substation blackout shuts down hospital backup generators. Mobile trauma units and patient transport ambulances mobilized.',
      actionText: 'Inject Grid Blackout Crisis',
    },
  ];

  const handleTrigger = async (scenarioId: string, title: string) => {
    setInjectingScenario(scenarioId);
    tacticalAudio.playWarningSiren();
    tacticalAudio.speak(`Attention command. Disaster scenario injected: ${title}. Replanning in progress.`, 'urgent');

    try {
      if (scenarioId === 'chemical') {
        await demoApi.simulateCriticalIncident();
      } else {
        await demoApi.injectScenario(scenarioId);
      }
      await onScenarioInjected();
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Scenario injection failed');
    } finally {
      setInjectingScenario(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative hud-panel rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-red-500/40 shadow-2xl overflow-hidden">
        {/* Corner Brackets */}
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />
        <div className="corner-bracket-br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>MULTI-HAZARD DISASTER SIMULATOR</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-300 font-mono font-bold">
                  CHAOS TEST
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Inject catastrophic incoming crises to demonstrate real-time LangGraph multi-agent preemption
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenario Grid */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {scenarios.map((sc) => {
            const isLoading = injectingScenario === sc.id;
            return (
              <div
                key={sc.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${sc.color}`}
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700/60 shrink-0 mt-0.5">
                    {sc.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{sc.title}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${sc.badge}`}>
                        {sc.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{sc.description}</p>
                    <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-3">
                      <span>Severity: <strong className="text-red-400">{sc.severity}</strong></span>
                      <span>&bull;</span>
                      <span>Casualties: <strong className="text-white">{sc.casualties}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleTrigger(sc.id, sc.title)}
                  disabled={isLoading || injectingScenario !== null}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg transition active:scale-95 shrink-0"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Injecting &amp; Replanning...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{sc.actionText}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
