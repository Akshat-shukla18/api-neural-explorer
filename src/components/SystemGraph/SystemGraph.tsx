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

export const SystemGraph: React.FC<SystemGraphProps> = ({ stageStates, activeToolCall, theme = 'dark' }) => {
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
      <div className={`h-10 border-b px-4 flex items-center justify-between text-xs font-mono ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0d121d] border-[#1a2234] text-slate-200'
      }`}>
        <div className="flex items-center gap-2 font-semibold uppercase tracking-wider">
          <Cpu className={`w-4 h-4 ${isLight ? 'text-slate-900' : 'text-sky-400'}`} />
          <span>MCP / AI NEURAL PIPELINE</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-slate-900' : 'bg-sky-400'}`} />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-slate-700' : 'bg-sky-400'}`} />
            <span>Complete</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-slate-300' : 'bg-slate-600'}`} />
            <span>Waiting</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Error</span>
          </div>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.4}
          maxZoom={1.5}
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
            className={isLight 
              ? '!bg-white !border-slate-300 !fill-slate-800 !rounded-lg shadow-sm'
              : '!bg-[#0d121d] !border-[#1e2638] !fill-slate-300 !rounded-lg'
            }
          />
        </ReactFlow>
      </div>

      {/* Telemetry Footer */}
      <div className={`h-8 border-t px-4 flex items-center justify-between text-[11px] font-mono ${
        isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0a0d14] border-[#1a2234] text-slate-400'
      }`}>
        <div className="flex items-center gap-2">
          <Server className={`w-3.5 h-3.5 ${isLight ? 'text-slate-800' : 'text-sky-400'}`} />
          <span>MCP PROTOCOL ACTIVE: 3 TOOLS DISPATCHABLE</span>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <span>VECTOR DB: 384-DIM COSINE INDEX</span>
        </div>
      </div>
    </div>
  );
};
