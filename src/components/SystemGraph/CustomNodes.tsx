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

const stageIcons: Record<string, React.ReactNode> = {
  api: <Network className="w-4 h-4 text-cyan-400" />,
  json_parser: <FileCode className="w-4 h-4 text-cyan-400" />,
  nlp: <Cpu className="w-4 h-4 text-purple-400" />,
  tokenizer: <Layers className="w-4 h-4 text-purple-400" />,
  chunker: <Scissors className="w-4 h-4 text-purple-400" />,
  embedding: <Binary className="w-4 h-4 text-blue-400" />,
  vector_db: <Database className="w-4 h-4 text-amber-400" />,
  mcp_server: <Server className="w-4 h-4 text-emerald-400" />,
  rag: <Search className="w-4 h-4 text-pink-400" />,
  llm: <Sparkles className="w-4 h-4 text-indigo-400" />
};

const categoryBorders: Record<string, string> = {
  api: 'border-cyan-500/50 shadow-[0_0_16px_rgba(6,182,212,0.15)]',
  nlp: 'border-purple-500/50 shadow-[0_0_16px_rgba(168,85,247,0.15)]',
  embedding: 'border-blue-500/50 shadow-[0_0_16px_rgba(59,130,246,0.15)]',
  vector: 'border-amber-500/50 shadow-[0_0_16px_rgba(245,158,11,0.15)]',
  mcp: 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]',
  rag: 'border-pink-500/50 shadow-[0_0_16px_rgba(236,72,153,0.15)]',
  llm: 'border-indigo-400/50 shadow-[0_0_16px_rgba(129,140,248,0.15)]'
};

const categoryActiveGlow: Record<string, string> = {
  api: 'border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.4)] animate-pulse',
  nlp: 'border-purple-400 shadow-[0_0_24px_rgba(168,85,247,0.4)] animate-pulse',
  embedding: 'border-blue-400 shadow-[0_0_24px_rgba(59,130,246,0.4)] animate-pulse',
  vector: 'border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.4)] animate-pulse',
  mcp: 'border-emerald-400 shadow-[0_0_28px_rgba(16,185,129,0.5)] animate-pulse',
  rag: 'border-pink-400 shadow-[0_0_24px_rgba(236,72,153,0.4)] animate-pulse',
  llm: 'border-indigo-300 shadow-[0_0_24px_rgba(129,140,248,0.4)] animate-pulse'
};

export const PipelineNodeComponent = ({ data }: { data: PipelineNodeData }) => {
  const isProcessing = data.status === 'PROCESSING';
  const isComplete = data.status === 'COMPLETE';
  const isError = data.status === 'ERROR';

  const borderStyle = isProcessing
    ? categoryActiveGlow[data.category]
    : isComplete
    ? categoryBorders[data.category]
    : isError
    ? 'border-red-500 shadow-[0_0_16px_rgba(239,68,68,0.3)]'
    : 'border-[#1e2638] hover:border-[#2d3a54]';

  return (
    <div className={`w-52 rounded-xl bg-[#0b0e17] border ${borderStyle} p-3 transition-all select-none font-mono text-xs shadow-xl`}>
      <Handle type="target" position={Position.Top} className="!bg-[#2d3a54] !w-2.5 !h-2.5 !border-2 !border-[#0b0e17]" />
      
      <div className="flex items-center justify-between gap-2 border-b border-[#182030] pb-2 mb-2">
        <div className="flex items-center gap-2">
          {stageIcons[data.id]}
          <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
            {data.label}
          </span>
        </div>

        {isProcessing && (
          <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            BUSY
          </span>
        )}
        {isComplete && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            OK
          </span>
        )}
        {data.status === 'WAITING' && (
          <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-[#111622] px-1.5 py-0.5 rounded border border-[#1e2638]">
            <Clock className="w-3 h-3 text-slate-500" />
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

      <div className="space-y-1 text-[10px] text-slate-400">
        {data.metrics?.recordsCount !== undefined && (
          <div className="flex justify-between">
            <span className="text-slate-500">Records:</span>
            <span className="text-cyan-400 font-semibold">{data.metrics.recordsCount}</span>
          </div>
        )}
        {data.metrics?.fieldsCount !== undefined && (
          <div className="flex justify-between">
            <span className="text-slate-500">Fields:</span>
            <span className="text-cyan-400 font-semibold">{data.metrics.fieldsCount}</span>
          </div>
        )}
        {data.metrics?.tokensCount !== undefined && (
          <div className="flex justify-between">
            <span className="text-slate-500">Tokens:</span>
            <span className="text-purple-400 font-semibold">{data.metrics.tokensCount}</span>
          </div>
        )}
        {data.metrics?.chunksCount !== undefined && (
          <div className="flex justify-between">
            <span className="text-slate-500">Chunks:</span>
            <span className="text-purple-400 font-semibold">{data.metrics.chunksCount}</span>
          </div>
        )}
        {data.metrics?.dimensions !== undefined && (
          <div className="flex justify-between">
            <span className="text-slate-500">Embedding:</span>
            <span className="text-blue-400 font-semibold">{data.metrics.dimensions}-dim</span>
          </div>
        )}
        {data.metrics?.latencyMs !== undefined && (
          <div className="flex justify-between">
            <span className="text-slate-500">Latency:</span>
            <span className="text-slate-300">{data.metrics.latencyMs} ms</span>
          </div>
        )}
      </div>

      {data.id === 'mcp_server' && (
        <div className="mt-2.5 pt-2 border-t border-[#1e2638] space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-emerald-400 font-bold tracking-wider">MCP TOOLS</span>
            <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1 rounded font-mono">
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
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse'
                      : 'bg-[#111622] text-slate-300 border border-[#1e2638]'
                  }`}
                >
                  <span className="font-semibold">{toolName}</span>
                  {isToolActive ? (
                    <span className="text-[9px] text-emerald-400 font-bold uppercase">EXECUTING</span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#2d3a54] !w-2.5 !h-2.5 !border-2 !border-[#0b0e17]" />
    </div>
  );
};
