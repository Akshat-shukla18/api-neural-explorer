import React, { useState } from 'react';
import { Network, ArrowRight, ShieldCheck, Cpu, Code2, Database, Zap } from 'lucide-react';
import { SAMPLE_APIS } from '../services/apiService';
import type { SampleApiOption } from '../types';

interface HeroConnectProps {
  onConnect: (url: string) => void;
  isLoading: boolean;
}

export const HeroConnect: React.FC<HeroConnectProps> = ({ onConnect, isLoading }) => {
  const [urlInput, setUrlInput] = useState<string>('https://api.example.com/products');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onConnect(urlInput.trim());
    }
  };

  const handleSelectSample = (sample: SampleApiOption) => {
    setUrlInput(sample.url);
    onConnect(sample.url);
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-[#07090e] overflow-hidden select-none">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[250px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-3xl w-full mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111622] border border-[#232d42] text-xs font-mono text-cyan-400">
          <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>REAL-TIME API → NLP → RAG → MCP OBSERVABILITY ENGINE</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white font-sans">
            Connect an API. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Watch intelligence flow through it.
            </span>
          </h1>
          <p className="text-base md:text-lg text-slate-400 font-sans max-w-2xl mx-auto leading-relaxed">
            Explore real API data through NLP, RAG, and MCP — in real time with an interactive neural data pipeline.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
          <div className="relative flex items-center rounded-xl bg-[#0d121d] border border-[#232d42] focus-within:border-cyan-500/80 focus-within:shadow-[0_0_24px_rgba(6,182,212,0.15)] transition-all p-1.5">
            <div className="pl-3.5 text-slate-500 flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-400" />
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://api.example.com/data"
              className="w-full bg-transparent px-3 py-3 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_16px_rgba(6,182,212,0.3)] shrink-0"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>CONNECTING...</span>
                </>
              ) : (
                <>
                  <span>CONNECT API</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supports JSON REST APIs (Public or Sample Datasets)</span>
          </div>
        </form>

        <div className="space-y-3 pt-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-500 block">
            Or test with real sample API payloads:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {SAMPLE_APIS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="p-3.5 rounded-lg bg-[#0d121d] hover:bg-[#131b2c] border border-[#1e2638] hover:border-cyan-500/40 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                      {sample.name}
                    </span>
                    <Code2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {sample.description}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 font-mono text-[10px] text-slate-500 group-hover:text-slate-300">
                  <span>LOAD DATA</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-[#1a2234] text-left">
          <div className="p-3 rounded-lg bg-[#0a0d14] border border-[#182030]">
            <div className="text-cyan-400 font-mono text-xs font-semibold flex items-center gap-1.5 mb-1">
              <Network className="w-3.5 h-3.5" /> 1. INGESTION
            </div>
            <p className="text-[11px] text-slate-400">Live JSON response profiling & structural parsing</p>
          </div>
          <div className="p-3 rounded-lg bg-[#0a0d14] border border-[#182030]">
            <div className="text-purple-400 font-mono text-xs font-semibold flex items-center gap-1.5 mb-1">
              <Cpu className="w-3.5 h-3.5" /> 2. NLP & CHUNKS
            </div>
            <p className="text-[11px] text-slate-400">Tokenization, stopword filtering & lemmatization</p>
          </div>
          <div className="p-3 rounded-lg bg-[#0a0d14] border border-[#182030]">
            <div className="text-orange-400 font-mono text-xs font-semibold flex items-center gap-1.5 mb-1">
              <Database className="w-3.5 h-3.5" /> 3. VECTOR DB
            </div>
            <p className="text-[11px] text-slate-400">384-d vector embeddings & cosine indexing</p>
          </div>
          <div className="p-3 rounded-lg bg-[#0a0d14] border border-[#182030]">
            <div className="text-emerald-400 font-mono text-xs font-semibold flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5" /> 4. MCP & RAG
            </div>
            <p className="text-[11px] text-slate-400">Model Context Protocol tool calls & LLM retrieval</p>
          </div>
        </div>

      </div>
    </div>
  );
};
