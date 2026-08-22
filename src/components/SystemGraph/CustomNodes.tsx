import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  Network, 
  FileCode, 
  Cpu, 
  Layers, 
  Scissors, 
  Binary, 
  Database, 
  Server, 
  Search, 
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import type { PipelineNodeData } from '../../types';

interface ExtendedNodeData extends PipelineNodeData {
  theme?: 'dark' | 'light';
}

const stageIcons: Record<string, React.ReactNode> = {
  api: <Network className="w-4 h-4" />,
  json_parser: <FileCode className="w-4 h-4" />,
  nlp: <Cpu className="w-4 h-4" />,
  tokenizer: <Layers className="w-4 h-4" />,
  chunker: <Scissors className="w-4 h-4" />,
  embedding: <Binary className="w-4 h-4" />,
  vector_db: <Database className="w-4 h-4" />,
  mcp_server: <Server className="w-4 h-4" />,
  rag: <Search className="w-4 h-4" />,
  llm: <Sparkles className="w-4 h-4" />
};

export const PipelineNodeComponent = ({ data }: { data: ExtendedNodeData }) => {
  const isLight = data.theme === 'light';
  const isProcessing = data.status === 'PROCESSING';
  const isComplete = data.status === 'COMPLETE';
  const isError = data.status === 'ERROR';

  let borderStyle = isLight 
    ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
    : 'border-[#1e2638] bg-[#0b0e17] text-slate-100 shadow-xl';

  if (isProcessing) {
    borderStyle = isLight
      ? 'border-slate-900 bg-white text-slate-900 shadow-[0_0_16px_rgba(15,23,42,0.2)] animate-pulse'
      : 'border-sky-400 bg-[#0b0e17] text-slate-100 shadow-[0_0_24px_rgba(56,189,248,0.5)] animate-pulse';
  } else if (isComplete) {
    borderStyle = isLight
      ? 'border-slate-400 bg-white text-slate-900'
      : 'border-sky-500/50 bg-[#0b0e17] text-slate-100 shadow-[0_0_16px_rgba(56,189,248,0.2)]';
  } else if (isError) {
    borderStyle = 'border-red-500 bg-red-950/20 text-red-400 shadow-[0_0_16px_rgba(239,68,68,0.3)]';
  }

  return (
    <div className={`w-52 rounded-xl border p-3 transition-all select-none font-mono text-xs ${borderStyle}`}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className={isLight ? '!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-white' : '!bg-[#2d3a54] !w-2.5 !h-2.5 !border-2 !border-[#0b0e17]'} 
      />
      
      {/* Header Row */}
      <div className={`flex items-center justify-between gap-2 border-b pb-2 mb-2 ${
        isLight ? 'border-slate-200' : 'border-[#182030]'
      }`}>
        <div className="flex items-center gap-2">
          <span className={isLight ? 'text-slate-900' : 'text-sky-400'}>
            {stageIcons[data.id]}
          </span>
          <span className="font-bold uppercase tracking-wider text-[11px]">
            {data.label}
          </span>
        </div>

        {/* Status Badge */}
        {isProcessing && (
          <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
            isLight
              ? 'bg-slate-100 text-slate-900 border-slate-300'
              : 'bg-sky-950/80 text-sky-400 border-sky-800/80'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isLight ? 'bg-slate-900' : 'bg-sky-400'}`} />
            BUSY
          </span>
        )}
        {isComplete && (
          <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
            isLight
              ? 'bg-slate-100 text-slate-800 border-slate-300'
              : 'bg-sky-950/60 text-sky-400 border-sky-800/60'
          }`}>
            <CheckCircle2 className="w-3 h-3 text-sky-400" />
            OK
          </span>
        )}
        {data.status === 'WAITING' && (
          <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
            isLight
              ? 'bg-slate-100 text-slate-500 border-slate-200'
              : 'bg-[#111622] text-slate-500 border-[#1e2638]'
          }`}>
            <Clock className="w-3 h-3 text-slate-400" />
            WAIT
          </span>
        )}
        {isError && (
          <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-800">
            <AlertCircle className="w-3 h-3" />
            ERR
          </span>
        )}
      </div>

      {/* Metrics Row */}
      <div className={`space-y-1 text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
        {data.metrics?.recordsCount !== undefined && (
          <div className="flex justify-between">
            <span>Records:</span>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-sky-400'}`}>{data.metrics.recordsCount}</span>
          </div>
        )}
        {data.metrics?.fieldsCount !== undefined && (
          <div className="flex justify-between">
            <span>Fields:</span>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-sky-400'}`}>{data.metrics.fieldsCount}</span>
          </div>
        )}
        {data.metrics?.tokensCount !== undefined && (
          <div className="flex justify-between">
            <span>Tokens:</span>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-sky-400'}`}>{data.metrics.tokensCount}</span>
          </div>
        )}
        {data.metrics?.chunksCount !== undefined && (
          <div className="flex justify-between">
            <span>Chunks:</span>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-sky-400'}`}>{data.metrics.chunksCount}</span>
          </div>
        )}
        {data.metrics?.dimensions !== undefined && (
          <div className="flex justify-between">
            <span>Embedding:</span>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-sky-400'}`}>{data.metrics.dimensions}-dim</span>
          </div>
        )}
        {data.metrics?.latencyMs !== undefined && (
          <div className="flex justify-between">
            <span>Latency:</span>
            <span className="font-medium">{data.metrics.latencyMs} ms</span>
          </div>
        )}
      </div>

      {/* Expandable MCP Tools list for MCP Server node */}
      {data.id === 'mcp_server' && (
        <div className={`mt-2.5 pt-2 border-t space-y-1.5 ${isLight ? 'border-slate-200' : 'border-[#1e2638]'}`}>
          <div className="flex items-center justify-between text-[10px]">
            <span className={`font-bold tracking-wider ${isLight ? 'text-slate-900' : 'text-sky-400'}`}>MCP TOOLS</span>
            <span className={`text-[9px] px-1 rounded font-mono ${
              isLight ? 'bg-slate-100 text-slate-800 border border-slate-300' : 'bg-sky-950 text-sky-400'
            }`}>
              3 DISPATCHABLE
            </span>
          </div>
          <div className="space-y-1">
            {['api.fetch()', 'api.search()', 'api.retrieve()'].map((toolName) => {
              const isToolActive = data.activeTool === toolName;
              return (
                <div
                  key={toolName}
                  className={`px-2 py-1 rounded text-[10px] font-mono flex items-center justify-between transition-all ${
                    isToolActive
                      ? isLight 
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-sky-950 text-sky-300 border border-sky-500/80 shadow-[0_0_10px_rgba(56,189,248,0.3)] animate-pulse'
                      : isLight
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-[#111622] text-slate-300 border border-[#1e2638]'
                  }`}
                >
                  <span className="font-semibold">{toolName}</span>
                  {isToolActive ? (
                    <span className="text-[9px] font-bold uppercase">EXECUTING</span>
                  ) : (
                    <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-slate-400' : 'bg-sky-500/50'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className={isLight ? '!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-white' : '!bg-[#2d3a54] !w-2.5 !h-2.5 !border-2 !border-[#0b0e17]'} 
      />
    </div>
  );
};
