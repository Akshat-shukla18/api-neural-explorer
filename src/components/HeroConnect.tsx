import React, { useState } from 'react';
import { Network, ArrowRight, ShieldCheck, Cpu, Code2, Database, Zap } from 'lucide-react';
import { SAMPLE_APIS } from '../services/apiService';
import type { SampleApiOption } from '../types';

interface HeroConnectProps {
  onConnect: (url: string) => void;
  isLoading: boolean;
  theme?: 'dark' | 'light';
}

export const HeroConnect: React.FC<HeroConnectProps> = ({ onConnect, isLoading, theme = 'dark' }) => {
  const [urlInput, setUrlInput] = useState<string>('https://api.example.com/products');
  const isLight = theme === 'light';

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
    <div className={`relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 transition-colors overflow-hidden select-none ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#05070a] text-slate-100'
    }`}>
      {/* Background Technical Grid */}
      <div className={`absolute inset-0 bg-[radial-gradient(${isLight ? '#cbd5e1' : '#1e293b'}_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none`} />

      {/* Hero Content */}
      <div className="relative z-10 max-w-3xl w-full mx-auto text-center space-y-8">
        
        {/* Top Tag */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-medium ${
          isLight 
            ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
            : 'bg-[#0d121d] border-emerald-500/40 text-emerald-400'
        }`}>
          <Zap className={`w-3.5 h-3.5 animate-pulse ${isLight ? 'text-slate-900' : 'text-emerald-400'}`} />
          <span>REAL-TIME API → NLP → RAG → MCP OBSERVABILITY ENGINE</span>
        </div>

        {/* Headings */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-sans">
            Connect an API. <br />
            <span className={isLight 
              ? 'bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent' 
              : 'bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent'
            }>
              Watch intelligence flow through it.
            </span>
          </h1>
          <p className={`text-base md:text-lg max-w-2xl mx-auto leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            Explore real API data through NLP, RAG, and MCP — in real time with an interactive neural data pipeline.
          </p>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
          <div className={`relative flex items-center rounded-xl border transition-all p-1.5 ${
            isLight
              ? 'bg-white border-slate-300 focus-within:border-slate-900 shadow-md'
              : 'bg-[#0d121d] border-[#232d42] focus-within:border-emerald-500/80 focus-within:shadow-[0_0_24px_rgba(16,185,129,0.2)]'
          }`}>
            <div className="pl-3.5 flex items-center gap-2">
              <Network className={`w-5 h-5 ${isLight ? 'text-slate-800' : 'text-emerald-400'}`} />
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://api.example.com/data"
              className={`w-full bg-transparent px-3 py-3 font-mono text-sm focus:outline-none ${
                isLight ? 'text-slate-900 placeholder-slate-400' : 'text-slate-100 placeholder-slate-600'
              }`}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className={`px-6 py-3 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
                isLight
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_16px_rgba(16,185,129,0.4)]'
              }`}
            >
              {isLoading ? (
                <>
                  <span className={`w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin ${
                    isLight ? 'border-white' : 'border-slate-950'
                  }`} />
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

          <div className={`flex items-center justify-center gap-2 text-xs font-mono ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-slate-800' : 'text-emerald-400'}`} />
            <span>Supports JSON REST APIs (Public or Sample Datasets)</span>
          </div>
        </form>

        {/* Sample Datasets */}
        <div className="space-y-3 pt-2">
          <span className={`text-xs font-mono uppercase tracking-wider block ${
            isLight ? 'text-slate-500' : 'text-slate-500'
          }`}>
            Or test with real sample API payloads:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {SAMPLE_APIS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className={`p-3.5 rounded-lg border text-left transition-all group flex flex-col justify-between ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 hover:border-slate-500 text-slate-900 shadow-sm'
                    : 'bg-[#0d121d] hover:bg-[#131b2c] border-[#1e2638] hover:border-emerald-500/40 text-slate-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-mono text-xs font-semibold ${
                      isLight ? 'text-slate-900' : 'text-emerald-400'
                    }`}>
                      {sample.name}
                    </span>
                    <Code2 className={`w-3.5 h-3.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                  </div>
                  <p className={`text-[11px] leading-tight ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {sample.description}
                  </p>
                </div>
                <div className={`mt-3 flex items-center gap-1 font-mono text-[10px] ${
                  isLight ? 'text-slate-500 group-hover:text-slate-900' : 'text-slate-500 group-hover:text-emerald-300'
                }`}>
                  <span>LOAD DATA</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t text-left ${
          isLight ? 'border-slate-200' : 'border-[#1a2234]'
        }`}>
          <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0d14] border-[#182030]'}`}>
            <div className={`font-mono text-xs font-semibold flex items-center gap-1.5 mb-1 ${isLight ? 'text-slate-900' : 'text-emerald-400'}`}>
              <Network className="w-3.5 h-3.5" /> 1. INGESTION
            </div>
            <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Live JSON profiling & parsing</p>
          </div>
          <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0d14] border-[#182030]'}`}>
            <div className={`font-mono text-xs font-semibold flex items-center gap-1.5 mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Cpu className="w-3.5 h-3.5" /> 2. NLP & CHUNKS
            </div>
            <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Tokens & stopword filtering</p>
          </div>
          <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0d14] border-[#182030]'}`}>
            <div className={`font-mono text-xs font-semibold flex items-center gap-1.5 mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Database className="w-3.5 h-3.5" /> 3. VECTOR DB
            </div>
            <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>384-d vector embeddings</p>
          </div>
          <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0d14] border-[#182030]'}`}>
            <div className={`font-mono text-xs font-semibold flex items-center gap-1.5 mb-1 ${isLight ? 'text-slate-900' : 'text-emerald-400'}`}>
              <Zap className="w-3.5 h-3.5" /> 4. MCP & RAG
            </div>
            <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>MCP tool calls & LLM search</p>
          </div>
        </div>

      </div>
    </div>
  );
};
