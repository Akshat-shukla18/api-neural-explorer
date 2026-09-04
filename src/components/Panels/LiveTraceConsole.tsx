import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import type { TraceLog } from '../../types';

interface LiveTraceConsoleProps {
  logs: TraceLog[];
  onClearLogs: () => void;
  theme?: 'dark' | 'light';
}

export const LiveTraceConsole: React.FC<LiveTraceConsoleProps> = ({ logs, onClearLogs, theme = 'light' }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={`w-full h-full border-t flex flex-col font-mono text-xs select-none transition-colors ${
      isLight ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-[#05070a] text-slate-100 border-[#1a2234]'
    }`}>
      {/* Header */}
      <div className={`h-8 border-b px-3 sm:px-4 flex items-center justify-between shrink-0 ${
        isLight ? 'bg-slate-950 border-slate-800' : 'bg-[#0d121d] border-[#182030]'
      }`}>
        <div className={`flex items-center gap-1.5 sm:gap-2 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] truncate ${
          isLight ? 'text-white' : 'text-sky-400'
        }`}>
          <Terminal className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">LIVE SYSTEM TRACE</span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-normal hidden xs:inline">
            ({logs.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 hover:text-white transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Logs Output */}
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 text-[10px] sm:text-[11px] font-mono leading-relaxed custom-scrollbar"
      >
        {logs.length === 0 ? (
          <span className="text-slate-500 italic px-1">No events logged yet. Connect an API to start telemetry stream.</span>
        ) : (
          logs.map((log) => {
            let levelColor = 'text-slate-300';
            if (log.level === 'success') levelColor = isLight ? 'text-sky-400 font-bold' : 'text-sky-400 font-bold';
            if (log.level === 'warn') levelColor = 'text-amber-400 font-bold';
            if (log.level === 'error') levelColor = 'text-red-400 font-bold';
            if (log.level === 'mcp') levelColor = 'text-sky-300 font-bold';

            return (
              <div key={log.id} className="flex items-baseline flex-wrap sm:flex-nowrap gap-1.5 sm:gap-3 hover:bg-slate-800/60 px-1.5 py-0.5 rounded transition-colors">
                <span className="text-slate-500 shrink-0 select-all text-[9px] sm:text-[10px]">{log.timestamp}</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-white text-[9px] sm:text-[10px] font-bold tracking-wider uppercase shrink-0">
                  {log.stage}
                </span>
                <span className={`${levelColor} break-words flex-1 min-w-0`}>
                  {log.message}
                </span>
                {log.details && (
                  <span className="text-slate-400 italic text-[9px] sm:text-[10px] break-all">[{log.details}]</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
