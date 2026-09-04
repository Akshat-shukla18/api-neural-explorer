import React from 'react';
import { Cpu, Activity, Server, Database, Settings, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  apiStatus: 'ONLINE' | 'STANDBY' | 'ERROR';
  mcpStatus: 'ACTIVE' | 'IDLE';
  ragStatus: 'INDEXED' | 'UNINDEXED';
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiStatus,
  mcpStatus,
  ragStatus,
  theme,
  onToggleTheme,
  onOpenSettings
}) => {
  const isLight = theme === 'light';

  return (
   <header className={`h-14 sm:h-14 shrink-0 border-b px-3 sm:px-4 flex items-center justify-between text-xs select-none sticky top-0 z-50 transition-colors ${
      isLight 
        ? 'bg-white/90 backdrop-blur border-slate-200 text-slate-900' 
        : 'bg-[#0a0d14]/90 backdrop-blur border-[#1e2638] text-slate-100'
    }`}>
      {/* Brand Identity */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
          isLight
            ? 'bg-slate-900 text-white border border-slate-700 shadow-sm'
            : 'bg-sky-950/80 text-sky-400 border border-sky-500/40 shadow-[0_0_14px_rgba(56,189,248,0.3)]'
        }`}>
          <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wider uppercase font-sans text-xs sm:text-[13px] truncate">
              API Neural Explorer
            </span>
          </div>
          <p className={`text-[9px] sm:text-[10px] font-mono leading-none mt-0.5 hidden sm:block ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Observable AI Knowledge Console
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-[11px] ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#111622] border-[#1e2638]'
        }`}>
          <Activity className={`w-3 h-3 ${isLight ? 'text-slate-900' : 'text-sky-400'}`} />
          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>API:</span>
          <span className="font-semibold">{apiStatus}</span>
        </div>

        <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-[11px] ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#111622] border-[#1e2638]'
        }`}>
          <Server className={`w-3 h-3 ${isLight ? 'text-slate-900' : 'text-sky-400'}`} />
          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>MCP:</span>
          <span className="font-semibold">{mcpStatus}</span>
        </div>

        <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-[11px] ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#111622] border-[#1e2638]'
        }`}>
          <Database className={`w-3 h-3 ${isLight ? 'text-slate-900' : 'text-sky-400'}`} />
          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>RAG:</span>
          <span className="font-semibold">{ragStatus}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className={`p-1.5 sm:p-2 rounded-lg border font-mono flex items-center gap-1.5 text-xs transition-all ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
              : 'bg-[#111622] hover:bg-[#1a2234] border-[#232d42] text-sky-400'
          }`}
          title={isLight ? 'Switch to Night Mode' : 'Switch to Day Mode'}
        >
          {isLight ? <Moon className="w-4 h-4 text-slate-800" /> : <Sun className="w-4 h-4 text-sky-400" />}
          <span className="hidden sm:inline font-bold uppercase text-[11px]">
            {isLight ? 'NIGHT' : 'DAY'}
          </span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className={`p-1.5 sm:p-2 rounded-lg border transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-[#111622] hover:bg-[#1a2234] border-[#232d42] text-slate-300 hover:text-white'
          }`}
          title="System Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
