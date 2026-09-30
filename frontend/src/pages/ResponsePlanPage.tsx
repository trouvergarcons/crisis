import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Info 
} from 'lucide-react';
import { ResponsePlan } from '../types';

interface ResponsePlanPageProps {
  plan: ResponsePlan | null;
  onRefreshPlan: () => Promise<void>;
  onApproval: (action: 'approve' | 'reject' | 'review', notes?: string) => Promise<void>;
}

export const ResponsePlanPage: React.FC<ResponsePlanPageProps> = ({
  plan,
  onRefreshPlan,
  onApproval,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshPlan();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject' | 'review') => {
    setIsSubmitting(true);
    try {
      await onApproval(action, notes);
      setShowNotes(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!plan) {
    return (
      <div className="py-20 text-center bg-slate-900 border border-slate-800 rounded-xl p-6">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Active Response Plan</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Click generate to compile current allocations and agent recommendations into a plan.
        </p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
        >
          Generate Tactical Response Plan
        </button>
      </div>
    );
  }

  const isApproved = plan.approval_status === 'approved';
  const isRejected = plan.approval_status === 'rejected';

  return (
    <div className="space-y-6">
      {/* Top Banner with Plan Metadata & Approval Decision */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" />
                Response Plan {plan.plan_id}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold uppercase ${
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : isRejected
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                }`}
              >
                {plan.approval_status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Generated: {new Date(plan.generated_at).toLocaleString()} • Coordinated by LangGraph
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Plan</span>
            </button>

            <button
              onClick={() => handleAction('approve')}
              disabled={isSubmitting || isApproved}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
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
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mt-4 p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs leading-relaxed text-slate-300 flex items-start space-x-3">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white block mb-0.5">Tactical Situation Overview:</span>
            {plan.executive_summary}
          </div>
        </div>

        {/* Human Approval Reason Details (if flagged) */}
        {plan.human_approval_required && plan.approval_reasons.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
            <span className="font-semibold uppercase text-[11px] block mb-1 flex items-center gap-1.5 text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              Reasons Human Decision Check Required:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              {plan.approval_reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Incident Tactical Action Plans */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Incident Response Plans ({plan.incident_plans.length})
        </h3>

        {plan.incident_plans.map((incPlan) => {
          const isCritical = incPlan.priority_level === 'CRITICAL';
          const isHigh = incPlan.priority_level === 'HIGH';

          return (
            <div
              key={incPlan.incident_id}
              className={`bg-slate-900 border rounded-xl p-5 shadow-sm space-y-3.5 ${
                isCritical
                  ? 'border-red-500/40 bg-gradient-to-br from-red-950/20 to-slate-900'
                  : isHigh
                  ? 'border-orange-500/30'
                  : 'border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {incPlan.incident_title}
                  </h4>
                  <span className="text-xs font-mono text-slate-400">
                    ID: {incPlan.incident_id} • Priority Score: {incPlan.priority_score}
                  </span>
                </div>

                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    isCritical
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : isHigh
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  }`}
                >
                  {incPlan.priority_level}
                </span>
              </div>

              {/* Tactical Actions List */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Simulated Dispatch Actions
                </span>
                <div className="space-y-1">
                  {incPlan.actions.map((act, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-2 rounded flex items-center space-x-2 ${
                        act.includes('DEFICIT')
                          ? 'bg-red-950/50 border border-red-500/30 text-red-300'
                          : 'bg-slate-950/60 border border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned Resources Chips */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Assigned Field Units
                </span>
                <div className="flex flex-wrap gap-2">
                  {incPlan.allocated_resource_details.length === 0 ? (
                    <span className="text-xs text-red-400 italic">No resources allocated to this incident.</span>
                  ) : (
                    incPlan.allocated_resource_details.map((res) => (
                      <div
                        key={res.resource_id}
                        className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 flex items-center space-x-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="font-bold text-blue-400">{res.resource_id}</span>
                        <span className="text-slate-400">({res.name})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Human-Readable Rationale ("Why?") */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-slate-400 uppercase text-[10px] block mb-1 flex items-center gap-1">
                  <Info className="w-3 h-3 text-cyan-400" />
                  Tactical Rationale ("Why?"):
                </span>
                <p className="italic text-slate-300 leading-relaxed">{incPlan.rationale}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
