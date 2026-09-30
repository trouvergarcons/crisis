import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ShieldCheck, 
  Clock, 
  Info,
  X 
} from 'lucide-react';
import { ReplanEvent } from '../types';
import { tacticalAudio } from '../utils/audio';

interface ReplanningBannerProps {
  replanEvent: ReplanEvent | null;
  onApproval: (action: 'approve' | 'reject' | 'review', notes?: string) => Promise<void>;
  approvalStatus: string;
}

export const ReplanningBanner: React.FC<ReplanningBannerProps> = ({
  replanEvent,
  onApproval,
  approvalStatus,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastSeenEventId, setLastSeenEventId] = useState<string | null>(null);

  // If a new replan event arrives, reset dismissal state
  const currentEventId = replanEvent ? `${replanEvent.timestamp || ''}_${replanEvent.reason || ''}` : null;
  if (currentEventId && currentEventId !== lastSeenEventId) {
    setLastSeenEventId(currentEventId);
    setIsDismissed(false);
  }

  // If no active replan event, or if plan is already approved, or dismissed by user: DO NOT RENDER
  if (!replanEvent || approvalStatus === 'approved' || isDismissed) {
    return null;
  }

  const handleAction = async (action: 'approve' | 'reject' | 'review') => {
    setIsSubmitting(true);
    // Instantly dismiss visually so the commander experiences zero lag
    if (action === 'approve') {
      setIsDismissed(true);
      tacticalAudio.playDispatchChime();
      tacticalAudio.speak('Response plan approved by Commander. Fleet units mobilizing.');
    } else if (action === 'reject') {
      setIsDismissed(true);
      tacticalAudio.playWarningSiren();
      tacticalAudio.speak('Response plan rejected.');
    }

    try {
      await onApproval(action, notes);
      setShowNotesInput(false);
    } catch (err) {
      console.error('Approval action error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isApproved = approvalStatus === 'approved';
  const isRejected = approvalStatus === 'rejected';

  return (
    <div className="mb-6 rounded-xl border border-red-500/50 bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 p-5 shadow-2xl shadow-red-950/50 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/30 pb-3.5">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-red-600 text-white animate-bounce">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-wide text-red-200">
                🚨 REPLANNING TRIGGERED
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-red-500/20 text-red-300 border border-red-500/40">
                DYNAMIC ADAPTATION
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              <strong>Trigger:</strong> {replanEvent.reason}
            </p>
          </div>
        </div>

        {/* Status indicator and Close Dismiss button */}
        <div className="flex items-center space-x-2">
          {isApproved ? (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>APPROVED BY COMMAND</span>
            </span>
          ) : isRejected ? (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>REJECTED - MANUAL OVERRIDE</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>HUMAN APPROVAL REQUIRED</span>
            </span>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
            title="Dismiss Replan Notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Changes list / Before & After */}
      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
          <span>Reallocated Field Resources (Before vs After)</span>
          <span className="text-[11px] text-slate-500 font-mono">
            {replanEvent.changes.length} Tactical Preemptions Recorded
          </span>
        </div>

        {replanEvent.changes.length === 0 ? (
          <div className="text-xs text-slate-400 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
            No active units required preemption. Unassigned reserves deployed to fulfill requirements.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {replanEvent.changes.map((chg, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold text-white mb-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                    {chg.resource_id}
                  </span>
                  <span className="text-slate-400 capitalize text-[11px]">{chg.resource_type.replace('_', ' ')}</span>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-slate-950/60 border border-slate-800/80 mb-2">
                  <div className="text-slate-400">
                    <span className="text-[10px] uppercase block text-slate-500">BEFORE</span>
                    <span className="font-medium text-slate-300 truncate max-w-[110px] block">
                      {chg.previous_incident_title || 'Unassigned'}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-red-400 shrink-0 mx-1" />
                  <div className="text-right text-emerald-400">
                    <span className="text-[10px] uppercase block text-slate-500">AFTER</span>
                    <span className="font-medium truncate max-w-[110px] block">
                      {chg.new_incident_title || 'Reserve'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 italic border-l-2 border-red-500 pl-2 mt-1">
                  <strong>Why:</strong> {chg.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Human Approval Decision Controls */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-400 flex items-start space-x-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span>
            {replanEvent.approval_reasons.length > 0
              ? replanEvent.approval_reasons[0]
              : 'Deterministic priority evaluation reallocated resources to maximize life-saving capability.'}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => handleAction('approve')}
            disabled={isSubmitting || isApproved}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isApproved
                ? 'bg-emerald-600/30 text-emerald-300 cursor-not-allowed border border-emerald-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Approve Plan</span>
          </button>

          <button
            onClick={() => handleAction('reject')}
            disabled={isSubmitting || isRejected}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 transition"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>

          <button
            onClick={() => setShowNotesInput(!showNotesInput)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Review Notes</span>
          </button>
        </div>
      </div>

      {showNotesInput && (
        <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Commander notes or tactical justification..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleAction('review')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition"
          >
            Save Review
          </button>
        </div>
      )}
    </div>
  );
};
