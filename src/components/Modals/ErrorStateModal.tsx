import React from 'react';
import { AlertTriangle, RefreshCw, Database, X } from 'lucide-react';

interface ErrorStateModalProps {
  errorMessage: string;
  onRetry: () => void;
  onUseSampleData: () => void;
  onClose: () => void;
}

export const ErrorStateModal: React.FC<ErrorStateModalProps> = ({
  errorMessage,
  onRetry,
  onUseSampleData,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none font-mono">
      <div className="max-w-md w-full rounded-xl bg-[#0d121d] border border-red-500/50 p-6 space-y-6 shadow-[0_0_32px_rgba(239,68,68,0.2)] relative">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-red-400 tracking-wider">
              API CONNECTION FAILED
            </h2>
            <p className="text-[11px] text-slate-400">Network or Parsing Error</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#05070a] border border-[#1e2638] text-[11px] text-red-300 font-mono break-all">
          {errorMessage}
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            POSSIBLE CAUSES:
          </span>
          <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
            <li>Browser CORS restriction on foreign API endpoint</li>
            <li>Invalid or non-JSON REST payload structure</li>
            <li>Network connection timeout or DNS resolution failure</li>
            <li>Server HTTP 404 / 500 internal error</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-700 text-red-100 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>TRY AGAIN</span>
          </button>
          <button
            onClick={onUseSampleData}
            className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>LOAD DEMO DATA</span>
          </button>
        </div>

      </div>
    </div>
  );
};
