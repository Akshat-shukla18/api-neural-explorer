import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import type { TraceLog } from '../../types';

interface LiveTraceConsoleProps {
  logs: TraceLog[];
  onClearLogs: () => void;
}

export const LiveTraceConsole: React.FC<LiveTraceConsoleProps> = ({ logs, onClearLogs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-full bg-[#05070a] border-t border-[#1a2234] flex flex-col font-mono text-xs select-none">
      <div className="h-8 border-b border-[#182030] bg-[#0d121d] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>LIVE SYSTEM TRACE</span>
          <span className="text-[10px] text-slate-500 font-normal">
            ({logs.length} EVENTS RECORDED)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#131b2c] hover:bg-[#1c2840] border border-[#1e2638] text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Trash2 className="w-3 h-3 text-slate-400" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 text-[11px] font-mono leading-relaxed custom-scrollbar bg-[#05070a]"
      >
        {logs.length === 0 ? (
          <span className="text-slate-600 italic">No events logged yet. Connect an API to start telemetry stream.</span>
        ) : (
          logs.map((log) => {
            let levelColor = 'text-slate-300';
            if (log.level === 'success') levelColor = 'text-emerald-400 font-bold';
            if (log.level === 'warn') levelColor = 'text-amber-400 font-bold';
            if (log.level === 'error') levelColor = 'text-red-400 font-bold';
            if (log.level === 'mcp') levelColor = 'text-emerald-300 font-bold';

            return (
              <div key={log.id} className="flex items-start gap-3 hover:bg-[#0d121d] px-1 py-0.5 rounded transition-colors">
                <span className="text-slate-500 shrink-0 select-all">{log.timestamp}</span>
                <span className="px-1.5 py-0.2 rounded bg-[#101726] border border-[#1e2638] text-cyan-400 text-[10px] font-bold tracking-wider uppercase shrink-0">
                  {log.stage}
                </span>
                <span className={`${levelColor} break-all`}>
                  {log.message}
                </span>
                {log.details && (
                  <span className="text-slate-500 italic">[{log.details}]</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
