import React from 'react';
import { Department, UserSession } from '../types';
import { Shield, Flame, Ambulance, LifeBuoy, Radio, Check, Globe } from 'lucide-react';

interface DepartmentBannerProps {
  session: UserSession;
  activeDepartmentFilter: Department;
  onFilterChange: (dept: Department) => void;
  showAllAgencies: boolean;
  onToggleShowAll: () => void;
}

export const DepartmentBanner: React.FC<DepartmentBannerProps> = ({
  session,
  activeDepartmentFilter,
  onFilterChange,
  showAllAgencies,
  onToggleShowAll,
}) => {
  const departmentMeta: Record<
    Department,
    { title: string; color: string; bg: string; border: string; icon: React.ReactNode; code: string }
  > = {
    all: {
      title: 'Unified Multi-Agency Central Command',
      color: 'text-sky-300',
      bg: 'bg-sky-950/40',
      border: 'border-sky-500/30',
      icon: <Globe className="w-5 h-5 text-sky-400" />,
      code: 'CMD-HQ',
    },
    fire: {
      title: 'Fire Suppression & HazMat Division',
      color: 'text-orange-300',
      bg: 'bg-orange-950/40',
      border: 'border-orange-500/40',
      icon: <Flame className="w-5 h-5 text-orange-400" />,
      code: 'FIRE-DIV',
    },
    medical: {
      title: 'Emergency Medical & Trauma Services (EMS)',
      color: 'text-red-300',
      bg: 'bg-red-950/40',
      border: 'border-red-500/40',
      icon: <Ambulance className="w-5 h-5 text-red-400" />,
      code: 'EMS-CORPS',
    },
    rescue: {
      title: 'Disaster Search & Rescue Agency (SAR)',
      color: 'text-blue-300',
      bg: 'bg-blue-950/40',
      border: 'border-blue-500/40',
      icon: <LifeBuoy className="w-5 h-5 text-blue-400" />,
      code: 'SAR-TASKFORCE',
    },
    police: {
      title: 'Tactical Law Enforcement & Perimeter Security',
      color: 'text-cyan-300',
      bg: 'bg-cyan-950/40',
      border: 'border-cyan-500/40',
      icon: <Radio className="w-5 h-5 text-cyan-400" />,
      code: 'TAC-PATROL',
    },
  };

  const currentMeta = departmentMeta[activeDepartmentFilter] || departmentMeta.all;

  return (
    <div className={`relative hud-panel rounded-xl p-4 mb-6 shadow-xl overflow-hidden border ${currentMeta.border}`}>
      {/* Corner Brackets */}
      <div className="corner-bracket-tl" />
      <div className="corner-bracket-tr" />
      <div className="corner-bracket-bl" />
      <div className="corner-bracket-br" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Department Details & User Designation */}
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-xl ${currentMeta.bg} border ${currentMeta.border} shadow-lg shadow-black/40`}>
            {currentMeta.icon}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                {currentMeta.code}
              </span>
              <h2 className={`text-base font-extrabold tracking-wide ${currentMeta.color}`}>
                {currentMeta.title}
              </h2>
            </div>
            <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400">
              <span>
                Commander: <strong className="text-white">{session.displayName}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Badge: <strong className="font-mono text-sky-400">{session.badgeNumber}</strong>
              </span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-medium">DISPATCH AUTHORITY ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Right: Agency Filter Switcher & Mutual Aid Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Quick Switcher */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-1 text-[11px]">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase font-mono">
              Agency:
            </span>
            {(['all', 'fire', 'medical', 'rescue', 'police'] as Department[]).map((dept) => {
              const isSelected = activeDepartmentFilter === dept;
              return (
                <button
                  key={dept}
                  onClick={() => onFilterChange(dept)}
                  className={`px-2.5 py-1 rounded font-semibold transition ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {dept === 'all'
                    ? 'All'
                    : dept === 'fire'
                    ? 'Fire'
                    : dept === 'medical'
                    ? 'EMS'
                    : dept === 'rescue'
                    ? 'SAR'
                    : 'Police'}
                </button>
              );
            })}
          </div>

          {/* Mutual Aid Toggle */}
          <button
            onClick={onToggleShowAll}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-md transition ${
              showAllAgencies
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                showAllAgencies ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-500'
              }`}
            >
              {showAllAgencies && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span>Include Mutual Aid</span>
          </button>
        </div>
      </div>
    </div>
  );
};
