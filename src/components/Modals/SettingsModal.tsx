import React from 'react';
import { X, Sliders, Cpu, Database, Server } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono text-xs select-none">
      <div className="max-w-lg w-full rounded-xl bg-[#0d121d] border border-[#232d42] p-6 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#182030] pb-4">
          <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>SYSTEM & PROTOCOL CONFIGURATION</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings options */}
        <div className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Embedding Vector Model</span>
            </label>
            <select className="w-full bg-[#05070a] border border-[#1e2638] rounded p-2 text-slate-200 focus:outline-none">
              <option value="minilm">all-MiniLM-L6-v2 (384 dims) — Default</option>
              <option value="bge-small">BAAI/bge-small-en-v1.5 (384 dims)</option>
              <option value="text-embedding-3">OpenAI text-embedding-3-small (1536 dims)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>MCP Protocol Version</span>
            </label>
            <div className="p-2 rounded bg-[#05070a] border border-[#1e2638] text-slate-300 flex justify-between items-center">
              <span>Model Context Protocol (v2024-11-26)</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Vector Similarity Metric</span>
            </label>
            <select className="w-full bg-[#05070a] border border-[#1e2638] rounded p-2 text-slate-200 focus:outline-none">
              <option value="cosine">Cosine Distance (Recommended)</option>
              <option value="euclidean">Euclidean L2</option>
              <option value="dot">Dot Product</option>
            </select>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#182030] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider transition-colors"
          >
            SAVE CONFIG
          </button>
        </div>

      </div>
    </div>
  );
};
