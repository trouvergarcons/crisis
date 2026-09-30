import React, { useState } from 'react';
import { Radio, Send, Sparkles, Volume2, VolumeX, ChevronUp, ChevronDown, Bot, Terminal } from 'lucide-react';
import { demoApi } from '../api/demo';
import { tacticalAudio } from '../utils/audio';

interface TacticalRadioBarProps {
  onRefreshData: () => Promise<void>;
  onSelectIncident?: (id: string) => void;
}

export const TacticalRadioBar: React.FC<TacticalRadioBarProps> = ({
  onRefreshData,
  onSelectIncident,
}) => {
  const [query, setQuery] = useState<string>('');
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<{ query: string; reply: string } | null>({
    query: 'System Ready',
    reply: 'Tactical AI Transceiver online. Speak or type orders into the Multi-Agent Defense Grid.',
  });
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(tacticalAudio.getIsMuted());

  const handleToggleMute = () => {
    const newMuted = tacticalAudio.toggleMute();
    setIsMuted(newMuted);
  };

  const handleTransmit = async (textToSend?: string) => {
    const q = (textToSend || query).trim();
    if (!q) return;

    setIsTransmitting(true);
    tacticalAudio.playDispatchChime();

    try {
      const res = await demoApi.sendCommand(q);
      setLastResponse({ query: q, reply: res.reply });
      setQuery('');

      // Voice readout of situational response
      tacticalAudio.speak(res.reply);

      // Refresh state if action was triggered
      if (res.action === 'replan_triggered' || res.action === 'approval_granted') {
        await onRefreshData();
      }

      // If response focused on a specific incident, select it
      if (res.action === 'incident_focus' && res.incident_id && onSelectIncident) {
        onSelectIncident(res.incident_id);
      }
    } catch (err: unknown) {
      setLastResponse({
        query: q,
        reply: `Radio Interference Error: ${err instanceof Error ? err.message : 'Transmission failed.'}`,
      });
    } finally {
      setIsTransmitting(false);
    }
  };

  const quickPrompts = [
    { label: '🚑 EMS Reserves', prompt: 'What is our ambulance readiness?' },
    { label: '🚒 Fire Fleet', prompt: 'What is our fire engine readiness?' },
    { label: '🛟 SAR Teams', prompt: 'Are search and rescue teams ready?' },
    { label: '🚨 Worst Incident', prompt: 'Which incident has the highest casualties?' },
    { label: '🔄 Replan Sectors', prompt: 'Replan all resources for maximum life safety' },
    { label: '✅ Authorize Plan', prompt: 'Approve current response plan' },
  ];

  return (
    <div className="fixed bottom-3 right-3 sm:right-6 max-w-xl w-full z-40 px-3 sm:px-0">
      <div className="hud-panel rounded-2xl border border-sky-500/40 shadow-2xl overflow-hidden backdrop-blur-xl transition-all">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>TACTICAL AI RADIO TRANSCEIVER</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleMute}
              className={`p-1 rounded text-xs transition ${
                isMuted
                  ? 'text-red-400 hover:text-red-300'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
              title={isMuted ? 'Unmute Audio Dispatch Voice' : 'Mute Tactical Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expandable Body */}
        {isExpanded && (
          <div className="p-3.5 space-y-2.5">
            {/* Last Transmission Display */}
            {lastResponse && (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
                <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                  <span>Last Order: "{lastResponse.query}"</span>
                  <span className="text-emerald-400">STATUS: ACK</span>
                </div>
                <div className="text-sky-200 mt-1 flex items-start gap-1.5 font-sans leading-snug">
                  <Bot className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>{lastResponse.reply}</span>
                </div>
              </div>
            )}

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTransmit(p.prompt)}
                  disabled={isTransmitting}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-300 hover:text-sky-300 border border-slate-700/60 transition active:scale-95"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Command Input Field */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTransmit();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isTransmitting}
                  placeholder="Transmit order (e.g. 'Status of pileup', 'Replan all sectors')..."
                  className="w-full px-3 py-2 bg-slate-950/90 border border-slate-700 focus:border-sky-400 rounded-xl text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isTransmitting || !query.trim()}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 shrink-0"
              >
                {isTransmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Transmit</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
