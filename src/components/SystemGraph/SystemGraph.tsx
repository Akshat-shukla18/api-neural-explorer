import React, { useMemo } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  BackgroundVariant, 
  MarkerType
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PipelineNodeComponent } from './CustomNodes';
import type { PipelineNodeData, StageId } from '../../types';
import { Server, Cpu } from 'lucide-react';

interface SystemGraphProps {
  stageStates: Record<StageId, PipelineNodeData>;
  activeToolCall?: string;
  theme?: 'dark' | 'light';
}

const INITIAL_NODES_CONFIG: { id: StageId; label: string; category: PipelineNodeData['category']; x: number; y: number }[] = [
  { id: 'api', label: 'API INGESTION', category: 'api', x: 250, y: 30 },
  { id: 'json_parser', label: 'JSON PARSER', category: 'api', x: 250, y: 160 },
  { id: 'nlp', label: 'NLP PREPROCESSOR', category: 'nlp', x: 250, y: 290 },
  { id: 'tokenizer', label: 'TOKENIZER', category: 'nlp', x: 250, y: 420 },
  { id: 'chunker', label: 'CHUNKER', category: 'nlp', x: 250, y: 550 },
  { id: 'embedding', label: 'EMBEDDING ENGINE', category: 'embedding', x: 250, y: 680 },
  { id: 'vector_db', label: 'VECTOR DATABASE', category: 'vector', x: 250, y: 810 },
  { id: 'mcp_server', label: 'MCP SERVER', category: 'mcp', x: 250, y: 940 },
  { id: 'rag', label: 'RAG RETRIEVAL', category: 'rag', x: 250, y: 1150 },
  { id: 'llm', label: 'LLM INFERENCE', category: 'llm', x: 250, y: 1280 }
];

export const SystemGraph: React.FC<SystemGraphProps> = ({ stageStates, activeToolCall, theme = 'light' }) => {
  const isLight = theme === 'light';
  const nodeTypes = useMemo(() => ({ pipelineNode: PipelineNodeComponent }), []);

  const nodes: Node[] = useMemo(() => {
    return INITIAL_NODES_CONFIG.map(cfg => {
      const liveState = stageStates[cfg.id] || {
        id: cfg.id,
        label: cfg.label,
        category: cfg.category,
        status: 'WAITING'
      };

      return {
        id: cfg.id,
        type: 'pipelineNode',
        position: { x: cfg.x, y: cfg.y },
        data: {
          ...liveState,
          theme,
          activeTool: cfg.id === 'mcp_server' ? activeToolCall : undefined
        }
      };
    });
  }, [stageStates, activeToolCall, theme]);

  const edges: Edge[] = useMemo(() => {
    const list: Edge[] = [];
    for (let i = 0; i < INITIAL_NODES_CONFIG.length - 1; i++) {
      const sourceId = INITIAL_NODES_CONFIG[i].id;
      const targetId = INITIAL_NODES_CONFIG[i + 1].id;

      const sourceStatus = stageStates[sourceId]?.status;
      const targetStatus = stageStates[targetId]?.status;

      const isEdgeActive = sourceStatus === 'PROCESSING' || targetStatus === 'PROCESSING' || sourceStatus === 'COMPLETE';
      const isCurrentlyMoving = sourceStatus === 'PROCESSING' || targetStatus === 'PROCESSING';

      let edgeColor = isLight ? '#cbd5e1' : '#232d42';
      if (isCurrentlyMoving) edgeColor = isLight ? '#0f172a' : '#38bdf8';
      else if (sourceStatus === 'COMPLETE') edgeColor = isLight ? '#475569' : '#38bdf8';

      list.push({
        id: `e-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        animated: isEdgeActive,
        style: {
          stroke: edgeColor,
          strokeWidth: isCurrentlyMoving ? 3 : 2,
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor
        }
      });
    }
    return list;
  }, [stageStates, isLight]);

  return (
    <div className={`relative w-full h-full border-r flex flex-col select-none overflow-hidden transition-colors ${
      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#07090e] border-[#1a2234]'
    }`}>
      {/* Header Bar */}
      <div className={`min-h-10 border-b px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0d121d] border-[#1a2234] text-slate-200'
      }`}>
        <div className="flex items-center gap-2 font-semibold uppercase tracking-wider">
          <Cpu className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-900' : 'text-sky-400'}`} />
          <span className="truncate">MCP / AI PIPELINE</span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-slate-900' : 'bg-sky-400'}`} />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-slate-700' : 'bg-sky-400'}`} />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-slate-300' : 'bg-slate-600'}`} />
            <span>Wait</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Err</span>
          </div>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div className="flex-1 w-full h-full relative min-h-[300px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.3}
          maxZoom={1.5}
          panOnDrag={true}
          zoomOnPinch={true}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
          className={isLight ? 'bg-slate-50' : 'bg-[#07090e]'}
        >
          <Background 
            color={isLight ? '#cbd5e1' : '#161f30'} 
            variant={BackgroundVariant.Dots} 
            gap={24} 
            size={1} 
          />
          <Controls
  className={
    isLight
      ? '!bg-white !border-slate-300 !rounded-lg !shadow-sm !m-2 ' +
        '[&>button]:!bg-white [&>button]:!text-slate-700 [&>button]:!border-slate-200 ' +
        '[&>button:hover]:!bg-slate-100'
      : '!bg-[#111827] !border-[#263247] !rounded-lg !shadow-sm !m-2 ' +
        '[&>button]:!bg-[#111827] [&>button]:!text-slate-300 [&>button]:!border-[#263247] ' +
        '[&>button:hover]:!bg-[#1e293b]'
  }
/>
        </ReactFlow>
      </div>

      {/* Telemetry Footer */}
      <div className={`min-h-8 border-t px-3 sm:px-4 py-1.5 sm:py-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] font-mono ${
        isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0a0d14] border-[#1a2234] text-slate-400'
      }`}>
        <div className="flex items-center gap-1.5 truncate">
          <Server className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-slate-800' : 'text-sky-400'}`} />
          <span className="truncate">MCP PROTOCOL: 3 TOOLS DISPATCHABLE</span>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <span>VECTOR DB: 384-DIM COSINE</span>
        </div>
      </div>
    </div>
  );
};
