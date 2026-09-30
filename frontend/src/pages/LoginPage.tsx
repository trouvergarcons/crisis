import React, { useState } from 'react';
import { Department, UserRole, UserSession } from '../types';
import { 
  ShieldAlert, 
  KeyRound, 
  ArrowRight, 
  Flame, 
  Ambulance, 
  LifeBuoy, 
  Radio, 
  Globe, 
  User, 
  Activity, 
  CheckCircle2, 
  Zap,
  Sparkles
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (session: UserSession) => void;
  isWarping?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isWarping = false }) => {
  const [personnelId, setPersonnelId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Quick preset badges for instant 1-click access
  const quickPresets = [
    {
      code: 'FD-101',
      dept: 'fire' as Department,
      title: 'Fire & HazMat',
      role: 'dept_admin' as UserRole,
      commander: 'Battalion Chief Vance',
      icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
      border: 'hover:border-orange-500/50 hover:bg-orange-950/30',
      tagColor: 'text-orange-400 border-orange-500/40 bg-orange-950/60',
    },
    {
      code: 'MED-204',
      dept: 'medical' as Department,
      title: 'Medical EMS',
      role: 'dept_admin' as UserRole,
      commander: 'Medical Director Dr. Chen',
      icon: <Ambulance className="w-3.5 h-3.5 text-red-400" />,
      border: 'hover:border-red-500/50 hover:bg-red-950/30',
      tagColor: 'text-red-400 border-red-500/40 bg-red-950/60',
    },
    {
      code: 'SAR-309',
      dept: 'rescue' as Department,
      title: 'Search & Rescue',
      role: 'dept_admin' as UserRole,
      commander: 'Rescue Commander Ramos',
      icon: <LifeBuoy className="w-3.5 h-3.5 text-blue-400" />,
      border: 'hover:border-blue-500/50 hover:bg-blue-950/30',
      tagColor: 'text-blue-400 border-blue-500/40 bg-blue-950/60',
    },
    {
      code: 'PD-502',
      dept: 'police' as Department,
      title: 'Tactical Police',
      role: 'dept_admin' as UserRole,
      commander: 'Deputy Chief Kowalski',
      icon: <Radio className="w-3.5 h-3.5 text-cyan-400" />,
      border: 'hover:border-cyan-500/50 hover:bg-cyan-950/30',
      tagColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/60',
    },
    {
      code: 'HQ-001',
      dept: 'all' as Department,
      title: 'Central Command',
      role: 'super_admin' as UserRole,
      commander: 'Crisis Commander Marcus Vance',
      icon: <Globe className="w-3.5 h-3.5 text-emerald-400" />,
      border: 'hover:border-emerald-500/50 hover:bg-emerald-950/30',
      tagColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60',
    },
    {
      code: 'OP-044',
      dept: 'all' as Department,
      title: 'General Dispatcher',
      role: 'operator' as UserRole,
      commander: 'Tactical Dispatcher Davis',
      icon: <User className="w-3.5 h-3.5 text-sky-400" />,
      border: 'hover:border-sky-500/50 hover:bg-sky-950/30',
      tagColor: 'text-sky-400 border-sky-500/40 bg-sky-950/60',
    },
  ];

  const resolveAndLogin = (rawId: string) => {
    const trimmed = rawId.trim();
    if (!trimmed) {
      setError('Please enter your Personnel, Department, or Dispatcher ID.');
      return;
    }

    const upper = trimmed.toUpperCase();
    let dept: Department = 'all';
    let deptName = 'Central Incident Command';
    let role: UserRole = 'operator';
    let displayName = `Officer ${upper}`;
    const username = upper.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Smart matching based on ID code
    if (upper.includes('FD') || upper.includes('FIRE') || upper === '101') {
      dept = 'fire';
      deptName = 'Fire & HazMat Division';
      role = 'dept_admin';
      displayName = 'Battalion Chief Vance';
    } else if (upper.includes('MED') || upper.includes('EMS') || upper.includes('AMB') || upper === '204') {
      dept = 'medical';
      deptName = 'Emergency Medical Services (EMS)';
      role = 'dept_admin';
      displayName = 'Medical Director Dr. Chen';
    } else if (upper.includes('SAR') || upper.includes('RESCUE') || upper === '309') {
      dept = 'rescue';
      deptName = 'Search & Rescue (SAR)';
      role = 'dept_admin';
      displayName = 'Rescue Commander Ramos';
    } else if (upper.includes('PD') || upper.includes('POLICE') || upper === '502') {
      dept = 'police';
      deptName = 'Tactical Police & Perimeter';
      role = 'dept_admin';
      displayName = 'Deputy Chief Kowalski';
    } else if (upper.includes('HQ') || upper.includes('CMD') || upper === '001') {
      dept = 'all';
      deptName = 'Central Command (Super Admin)';
      role = 'super_admin';
      displayName = 'Crisis Commander Marcus Vance';
    } else {
      dept = 'all';
      deptName = 'Tactical Emergency Operations';
      role = 'operator';
      displayName = `Dispatcher ${upper}`;
    }

    const session: UserSession = {
      username,
      displayName,
      role,
      department: dept,
      departmentName: deptName,
      badgeNumber: upper,
    };

    setError(null);
    onLogin(session);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resolveAndLogin(personnelId);
  };

  const handleQuickSelect = (preset: typeof quickPresets[0]) => {
    setPersonnelId(preset.code);
    resolveAndLogin(preset.code);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 z-10">
      {/* Central Cybernetic Login Card */}
      <div 
        className={`w-full max-w-lg transition-all duration-700 transform ${
          isWarping 
            ? 'opacity-0 scale-90 blur-sm pointer-events-none' 
            : 'opacity-100 scale-100'
        }`}
      >
        <div className="relative hud-panel rounded-2xl p-6 sm:p-8 shadow-2xl border border-sky-500/30 overflow-hidden backdrop-blur-xl">
          {/* Cybernetic Corner Brackets */}
          <div className="corner-bracket-tl" />
          <div className="corner-bracket-tr" />
          <div className="corner-bracket-bl" />
          <div className="corner-bracket-br" />

          {/* Top Status Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="relative p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]">
                <ShieldAlert className="w-6 h-6 animate-pulse text-sky-400" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-wider text-white uppercase flex items-center gap-2">
                  <span>CRISIS COMMAND</span>
                  <span className="text-[10px] px-2 py-0.5 font-mono rounded bg-sky-950/80 border border-sky-500/40 text-sky-300 font-bold">
                    3D GRID ACTIVE
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 font-mono tracking-wide">
                  TACTICAL DEFENSE ACCESS GATEWAY
                </p>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end text-[10px] font-mono text-emerald-400">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>GRID SECURE</span>
              </div>
              <span className="text-slate-500">PORT 8000 LIVE</span>
            </div>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-mono flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span>{error}</span>
            </div>
          )}

          {/* Streamlined Single ID Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                  <span>Personnel / Department ID</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 normal-case">
                  No password required
                </span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  disabled={isWarping}
                  value={personnelId}
                  onChange={(e) => setPersonnelId(e.target.value)}
                  placeholder="Enter ID: FD-101, MED-204, SAR-309, PD-502, HQ-001..."
                  className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700 focus:border-sky-400 rounded-xl text-white font-mono text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition shadow-inner placeholder:text-slate-600 uppercase"
                />
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-1.5 flex items-center gap-1">
                <span>⚡</span>
                <span>Type any Department or Operator ID, or choose a one-click badge below:</span>
              </p>
            </div>

            {/* Quick 1-Click ID Chips */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                Instant Access Badges:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickPresets.map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    disabled={isWarping}
                    onClick={() => handleQuickSelect(preset)}
                    className={`p-2 rounded-xl bg-slate-900/70 border border-slate-800 text-left transition flex items-center gap-2 group active:scale-95 ${preset.border}`}
                  >
                    <div className="p-1 rounded bg-slate-800/80 shrink-0">
                      {preset.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-white group-hover:text-sky-300 truncate">
                        {preset.code}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 truncate">
                        {preset.title}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit / Warp Button */}
            <button
              type="submit"
              disabled={isWarping}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                isWarping
                  ? 'bg-sky-500 text-white shadow-sky-500/50 animate-pulse'
                  : 'bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white shadow-sky-950/60 active:scale-[0.98]'
              }`}
            >
              {isWarping ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="font-mono">ENGAGING 3D WARP DIVE...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-sky-200" />
                  <span>AUTHORIZE & ENTER COMMAND</span>
                  <ArrowRight className="w-4 h-4 text-sky-200" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>MULTI-AGENT AI PROTOCOL</span>
            <span className="text-sky-400/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>LANGGRAPH DETERMINISTIC</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
