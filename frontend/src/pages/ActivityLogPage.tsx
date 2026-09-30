import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { TimelineItem } from '../types';

interface ActivityLogPageProps {
  timeline: TimelineItem[];
  onRefresh: () => Promise<void>;
}

export const ActivityLogPage: React.FC<ActivityLogPageProps> = ({
  timeline,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredTimeline = timeline.filter((item) => {
    if (filterType !== 'ALL' && !item.type.toLowerCase().includes(filterType.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim() && !item.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search event logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Type filters */}
          <div className="flex items-center space-x-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            {['ALL', 'ASSESSMENT', 'PRIORITY', 'ALLOCATION', 'REPLAN', 'APPROVAL'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  filterType === t
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Timeline Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>Autonomous Multi-Agent Workflow Trajectory</span>
        </div>

        {filteredTimeline.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">
            No events found matching current criteria.
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
            {filteredTimeline.map((item, idx) => {
              const isAlert =
                item.type.includes('alert') ||
                item.type.includes('replan') ||
                item.type.includes('failure');
              const isPriority = item.type.includes('priority');
              const isAssessment = item.type.includes('assessment');
              const isApproval = item.type.includes('approval');

              const dotColor = isAlert
                ? 'bg-red-500 ring-4 ring-red-500/20'
                : isPriority
                ? 'bg-amber-500 ring-4 ring-amber-500/20'
                : isAssessment
                ? 'bg-purple-500 ring-4 ring-purple-500/20'
                : isApproval
                ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                : 'bg-blue-500 ring-4 ring-blue-500/20';

              return (
                <div key={idx} className="relative group">
                  {/* Pin Dot */}
                  <div
                    className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full ${dotColor} transition-transform group-hover:scale-125`}
                  />

                  <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-3.5 hover:border-slate-700 transition">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono text-slate-500">
                          {item.timestamp}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                            isAlert
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : isPriority
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : isAssessment
                              ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                              : isApproval
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {item.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {item.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
