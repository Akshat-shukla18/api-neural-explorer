import React, { useState } from 'react';
import { Network, ArrowRight, ShieldCheck, Cpu, Code2, Database, Zap } from 'lucide-react';
import Hyperspeed from './Hyperspeed';
import { GuidePopup } from './GuidePopup';
import { SAMPLE_APIS } from '../services/apiService';
import type { SampleApiOption } from '../types';

interface HeroConnectProps {
  onConnect: (url: string) => void;
  isLoading: boolean;
  theme?: 'dark' | 'light';
}

export const HeroConnect: React.FC<HeroConnectProps> = ({ onConnect, isLoading, theme = 'light' }) => {
  const [urlInput, setUrlInput] = useState<string>('https://api.example.com/products');
  const [showGuide, setShowGuide] = useState(true);
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

  const effectOptions = React.useMemo(() => ({
    "distortion":"turbulentDistortion",
    "length":400,
    "roadWidth":10,
    "islandWidth":2,
    "lanesPerRoad":3,
    "fov":90,
    "fovSpeedUp":150,
    "speedUp":2,
    "carLightsFade":0.4,
    "totalSideLightSticks":20,
    "lightPairsPerRoadWay":40,
    "shoulderLinesWidthPercentage":0.05,
    "brokenLinesWidthPercentage":0.1,
    "brokenLinesLengthPercentage":0.5,
    "lightStickWidth":[0.12,0.5],
    "lightStickHeight":[1.3,1.7],
    "movingAwaySpeed":[60,80],
    "movingCloserSpeed":[-120,-160],
    "carLightsLength":[12,80],
    "carLightsRadius":[0.05,0.14],
    "carWidthPercentage":[0.3,0.5],
    "carShiftX":[-0.8,0.8],
    "carFloorSeparation":[0,5],
    "colors":{
      "roadColor":526344,
      "islandColor":657930,
      "background":0,
      "shoulderLines":1250072,
      "brokenLines":1250072,
      "leftCars":[14177983,6770850,12732332],
      "rightCars":[242627,941733,3294549],
      "sticks":242627
    }
  }), []);

  return (
    <div className={`relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 transition-colors select-none ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#05070a] text-slate-100'
    }`}>
      {/* Background Hyperspeed effect */}
      <div className="absolute inset-0 z-0 pointer-events-none md:pointer-events-auto">
        <Hyperspeed effectOptions={effectOptions} />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-3xl w-full mx-auto text-center space-y-6 sm:space-y-8 py-6">
        
        {/* Top Tag */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] sm:text-xs font-mono font-medium max-w-full overflow-hidden text-ellipsis ${
          isLight 
            ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
            : 'bg-[#0d121d] border-sky-500/40 text-sky-400'
        }`}>
          <Zap className={`w-3.5 h-3.5 shrink-0 animate-pulse ${isLight ? 'text-slate-900' : 'text-sky-400'}`} />
          <span className="truncate">REAL-TIME API → NLP → RAG → MCP OBSERVABILITY</span>
        </div>

        {/* Headings */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl mt-3 font-bold tracking-tight font-sans leading-tight">
            Connect an API. <br />
            <span className={isLight 
              ? 'bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent' 
              : 'bg-gradient-to-r from-sky-400 via-white to-sky-400 bg-clip-text text-transparent'
            }>
              Watch intelligence flow.
            </span>
          </h1>
          <p className={`text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-2 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            Explore real API data through NLP, RAG, and MCP — in real time with an interactive neural data pipeline.
          </p>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
          <div className={`relative flex flex-col sm:flex-row items-stretch sm:items-center rounded-xl border transition-all p-1.5 gap-1.5 sm:gap-0 ${
            isLight
              ? 'bg-white border-slate-300 focus-within:border-slate-900 shadow-md'
              : 'bg-[#0d121d] border-[#232d42] focus-within:border-sky-500/80 focus-within:shadow-[0_0_24px_rgba(56,189,248,0.2)]'
          }`}>
            <div className="flex items-center flex-1 min-w-0">
              <div className="pl-3 flex items-center gap-2 shrink-0">
                <Network className={`w-4 h-4 sm:w-5 sm:h-5 ${isLight ? 'text-slate-800' : 'text-sky-400'}`} />
              </div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://api.example.com/data"
                className={`w-full bg-transparent px-3 py-2.5 sm:py-3 font-mono text-xs sm:text-sm focus:outline-none min-w-0 ${
                  isLight ? 'text-slate-900 placeholder-slate-400' : 'text-slate-100 placeholder-slate-600'
                }`}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
                isLight
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-[0_0_16px_rgba(56,189,248,0.4)]'
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

          <div className={`flex items-center justify-center gap-2 text-[11px] sm:text-xs font-mono px-2 text-center ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-slate-800' : 'text-sky-400'}`} />
            <span>Supports JSON REST APIs (Public or Sample Datasets)</span>
          </div>
        </form>

        {/* Sample Datasets */}
        <div className="space-y-3 pt-2">
          <span className={`text-[11px] sm:text-xs font-mono uppercase tracking-wider block ${
            isLight ? 'text-slate-500' : 'text-slate-500'
          }`}>
            Or test with real sample API payloads:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 max-w-2xl mx-auto">
            {SAMPLE_APIS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className={`p-3 sm:p-3.5 rounded-lg border text-left transition-all group flex flex-col justify-between ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 hover:border-slate-500 text-slate-900 shadow-sm'
                    : 'bg-[#0d121d] hover:bg-[#131b2c] border-[#1e2638] hover:border-sky-500/40 text-slate-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-mono text-xs font-semibold ${
                      isLight ? 'text-slate-900' : 'text-sky-400'
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
                <div className={`mt-2.5 sm:mt-3 flex items-center gap-1 font-mono text-[10px] ${
                  isLight ? 'text-slate-500 group-hover:text-slate-900' : 'text-slate-500 group-hover:text-sky-300'
                }`}>
                  <span>LOAD DATA</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-5 sm:pt-6 border-t text-left ${
          isLight ? 'border-slate-200' : 'border-[#1a2234]'
        }`}>
          <div className={`p-2.5 sm:p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0d14] border-[#182030]'}`}>
            <div className={`font-mono text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 mb-1 ${isLight ? 'text-slate-900' : 'text-sky-400'}`}>
              <Network className="w-3.5 h-3.5 shrink-0" /> <span>1. INGESTION</span>
            </div>
            <p className={`text-[10px] sm:text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Live JSON profiling &amp; parsing</p>
          </div>
          <div className={`p-2.5 sm:p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0d14] border-[#182030]'}`}>
            <div className={`font-mono text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Cpu className="w-3.5 h-3.5 shrink-0" /> <span>2. NLP &amp; CHUNKS</span>
            </div>
            <p className={`text-[10px] sm:text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Tokens &amp; stopword filtering</p>
          </div>
          <div className={`p-2.5 sm:p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0d14] border-[#182030]'}`}>
            <div className={`font-mono text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Database className="w-3.5 h-3.5 shrink-0" /> <span>3. VECTOR DB</span>
            </div>
            <p className={`text-[10px] sm:text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>384-d vector embeddings</p>
          </div>
          <div className={`p-2.5 sm:p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0d14] border-[#182030]'}`}>
            <div className={`font-mono text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 mb-1 ${isLight ? 'text-slate-900' : 'text-sky-400'}`}>
              <Zap className="w-3.5 h-3.5 shrink-0" /> <span>4. MCP &amp; RAG</span>
            </div>
            <p className={`text-[10px] sm:text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>MCP tool calls &amp; LLM search</p>
          </div>
        </div>

      </div>

      {showGuide && (
        <GuidePopup onSkip={() => setShowGuide(false)} />
      )}
    </div>
  );
};
