import React from 'react';
import { Cpu, Activity, Server, Database, Settings } from 'lucide-react';

interface NavbarProps {
  apiStatus: 'ONLINE' | 'STANDBY' | 'ERROR';
  mcpStatus: 'ACTIVE' | 'IDLE';
  ragStatus: 'INDEXED' | 'UNINDEXED';
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiStatus,
  mcpStatus,
  ragStatus,
  onOpenSettings
}) => {
  return (
    <header className="h-14 bg-[#0a0d14]/90 backdrop-blur border-b border-[#1e2638] px-4 flex items-center justify-between text-xs select-none sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wider text-slate-100 uppercase font-sans text-[13px]">
              API Neural Explorer
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-medium">
              v2.4-mcp
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5 hidden sm:block">
            Observable AI Knowledge Console
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#111622] border border-[#232d42]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-mono text-[11px] tracking-wide text-emerald-400 font-medium">
          SYSTEM ONLINE
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111622] border border-[#1e2638] font-mono text-[11px]">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span className="text-slate-400">API:</span>
          <span className={apiStatus === 'ONLINE' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}>
            {apiStatus}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111622] border border-[#1e2638] font-mono text-[11px]">
          <Server className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-400">MCP:</span>
          <span className={mcpStatus === 'ACTIVE' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
            {mcpStatus}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111622] border border-[#1e2638] font-mono text-[11px]">
          <Database className="w-3 h-3 text-pink-400" />
          <span className="text-slate-400">RAG:</span>
          <span className={ragStatus === 'INDEXED' ? 'text-pink-400 font-semibold' : 'text-slate-400'}>
            {ragStatus}
          </span>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-[#111622] hover:bg-[#1a2234] border border-[#232d42] text-slate-300 hover:text-white transition-colors"
          title="System Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
