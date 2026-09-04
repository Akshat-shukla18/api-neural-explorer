import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Cpu, 
  Binary
} from 'lucide-react';
import type { ApiFetchResult, NlpAnalysis, VectorEmbedding } from '../../types';

interface ApiDataPanelProps {
  apiData: ApiFetchResult | null;
  nlpAnalysis: NlpAnalysis | null;
  vectorEmbedding: VectorEmbedding | null;
  highlightedRecordId?: string | number;
  theme?: 'dark' | 'light';
}

export const ApiDataPanel: React.FC<ApiDataPanelProps> = ({
  apiData,
  nlpAnalysis,
  vectorEmbedding,
  highlightedRecordId,
  theme = 'light'
}) => {
  const [copied, setCopied] = useState(false);
  const [isNlpOpen, setIsNlpOpen] = useState(true);
  const [isEmbeddingOpen, setIsEmbeddingOpen] = useState(true);
  const [isJsonFolded, setIsJsonFolded] = useState(false);
  const isLight = theme === 'light';

  const handleCopyJson = () => {
    if (apiData?.rawJson) {
      navigator.clipboard.writeText(apiData.rawJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!apiData) {
    return (
      <div className={`w-full h-full border-r p-4 font-mono text-xs flex items-center justify-center ${
        isLight ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-[#090c13] border-[#1a2234] text-slate-500'
      }`}>
        <span>No API connected yet.</span>
      </div>
    );
  }

  return (
    <div className={`w-full h-full border-r flex flex-col font-mono text-xs select-none overflow-hidden transition-colors ${
      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#090c13] border-[#1a2234] text-slate-100'
    }`}>
      {/* Panel Header */}
      <div className={`h-10 border-b px-3 sm:px-4 flex items-center justify-between shrink-0 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0d121d] border-[#1a2234]'
      }`}>
        <div className={`flex items-center gap-2 font-semibold uppercase tracking-wider text-xs ${
          isLight ? 'text-slate-900' : 'text-sky-400'
        }`}>
          <FileText className="w-4 h-4 shrink-0" />
          <span>API RESPONSE</span>
        </div>
        <button
          onClick={handleCopyJson}
          className={`flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded border transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-[#131b2c] hover:bg-[#1c2840] border-[#1e2638] text-slate-300'
          }`}
        >
          {copied ? <Check className="w-3 h-3 text-sky-500" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'COPIED' : 'COPY JSON'}</span>
        </button>
      </div>

      {/* Content Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar">
        
        {/* Telemetry Card */}
        <div className={`p-2.5 sm:p-3 rounded-lg border space-y-2 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d121d] border-[#1e2638]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-slate-900' : 'bg-sky-400'}`} />
              <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-sky-400'}`}>{apiData.status} {apiData.statusText}</span>
            </div>
            <span className={isLight ? 'text-slate-500 text-[11px]' : 'text-slate-400 text-[11px]'}>{apiData.responseTimeMs} ms</span>
          </div>

          <div className={`space-y-1 text-[11px] pt-1 border-t ${
            isLight ? 'border-slate-200 text-slate-600' : 'border-[#182030] text-slate-400'
          }`}>
            <div className="truncate">
              <span className="opacity-70">Endpoint: </span>
              <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-sky-300'}`}>{apiData.url}</span>
            </div>
            <div className="flex justify-between">
              <div>
                <span className="opacity-70">Records: </span>
                <span className="font-semibold">{apiData.recordsCount}</span>
              </div>
              <div>
                <span className="opacity-70">Size: </span>
                <span className="font-semibold">{(apiData.dataSizeBytes / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Formatted JSON Editor Style Viewer */}
        <div className={`rounded-lg border overflow-hidden ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#05070a] border-[#1a2234]'
        }`}>
          <div className={`px-3 py-1.5 border-b flex items-center justify-between text-[11px] ${
            isLight ? 'bg-slate-200 border-slate-300 text-slate-700' : 'bg-[#0d121d] border-[#182030] text-slate-400'
          }`}>
            <span>JSON PAYLOAD</span>
            <button
              onClick={() => setIsJsonFolded(!isJsonFolded)}
              className="flex items-center gap-1 opacity-80 hover:opacity-100"
            >
              {isJsonFolded ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>{isJsonFolded ? 'EXPAND' : 'COLLAPSE'}</span>
            </button>
          </div>

          {!isJsonFolded && (
            <div className={`p-3 max-h-56 overflow-auto text-[11px] font-mono leading-relaxed custom-scrollbar ${
              isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#05070a] text-slate-300'
            }`}>
              <pre className="whitespace-pre-wrap">
                {apiData.data.slice(0, 3).map((record, i) => {
                  const isHighlighted = highlightedRecordId !== undefined && String(record.id) === String(highlightedRecordId);
                  return (
                    <div 
                      key={record.id || i}
                      className={`p-1.5 rounded transition-colors my-1 ${
                        isHighlighted 
                          ? isLight 
                            ? 'bg-slate-300 border border-slate-900 text-slate-900 font-bold'
                            : 'bg-sky-950/80 border border-sky-500/80 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.3)]' 
                          : isLight ? 'hover:bg-slate-200' : 'hover:bg-[#0d121d]'
                      }`}
                    >
                      {JSON.stringify(record, null, 2)}
                    </div>
                  );
                })}
                {apiData.data.length > 3 && (
                  <span className="opacity-60 italic">
                    ... +{apiData.data.length - 3} more records
                  </span>
                )}
              </pre>
            </div>
          )}
        </div>

        {/* DATA PROFILE Grid */}
        <div className={`p-3 rounded-lg border space-y-2 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d121d] border-[#1e2638]'
        }`}>
          <span className={`font-bold uppercase tracking-wider text-[11px] block ${
            isLight ? 'text-slate-900' : 'text-sky-400'
          }`}>
            DATA PROFILE
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#07090e] border-[#161f30]'}`}>
              <span className="opacity-70 block">Records</span>
              <span className="font-bold text-sm">{apiData.recordsCount}</span>
            </div>
            <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#07090e] border-[#161f30]'}`}>
              <span className="opacity-70 block">Fields</span>
              <span className="font-bold text-sm">{apiData.fieldsCount}</span>
            </div>
            <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#07090e] border-[#161f30]'}`}>
              <span className="opacity-70 block">Nested Fields</span>
              <span className="font-bold text-sm">{apiData.nestedFieldsCount}</span>
            </div>
            <div className={`p-2 rounded border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#07090e] border-[#161f30]'}`}>
              <span className="opacity-70 block">Null Values</span>
              <span className="font-bold text-sm">{apiData.nullValuesCount}</span>
            </div>
          </div>
          <div className={`p-2 rounded border flex justify-between items-center text-[11px] ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#07090e] border-[#161f30]'
          }`}>
            <span className="opacity-70">Data Size</span>
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-sky-400'}`}>{(apiData.dataSizeBytes / 1024).toFixed(1)} KB</span>
          </div>
        </div>

        {/* NLP INSPECTOR */}
        {nlpAnalysis && (
          <div className={`rounded-lg border overflow-hidden ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d121d] border-[#1e2638]'
          }`}>
            <button
              onClick={() => setIsNlpOpen(!isNlpOpen)}
              className={`w-full px-3 py-2 flex items-center justify-between text-[11px] font-bold ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-900' : 'bg-[#101726] hover:bg-[#151f33] text-sky-400'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>NLP INSPECTOR</span>
              </div>
              {isNlpOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {isNlpOpen && (
              <div className="p-3 space-y-3 text-[11px]">
                <div>
                  <span className="opacity-70 block mb-1">Original Sample:</span>
                  <p className={`p-2 rounded border italic ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#05070a] border-[#182030] text-slate-300'
                  }`}>
                    "{nlpAnalysis.sampleText}"
                  </p>
                </div>

                <div>
                  <span className="opacity-70 block mb-1">Tokens:</span>
                  <div className="flex flex-wrap gap-1">
                    {nlpAnalysis.tokens.map((t, idx) => (
                      <span key={idx} className={`px-1.5 py-0.5 rounded border text-[10px] ${
                        isLight 
                          ? 'bg-slate-200 border-slate-300 text-slate-800' 
                          : 'bg-sky-950/60 border-sky-800/60 text-sky-300'
                      }`}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="opacity-70 block mb-1">Stopwords Removed:</span>
                  <div className="flex flex-wrap gap-1">
                    {nlpAnalysis.stopwordsRemoved.map((t, idx) => (
                      <span key={idx} className={`px-1.5 py-0.5 rounded border text-[10px] ${
                        isLight 
                          ? 'bg-slate-100 border-slate-300 text-slate-700' 
                          : 'bg-[#131b2c] border-[#1e2638] text-slate-300'
                      }`}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={`flex justify-between pt-1 border-t ${
                  isLight ? 'border-slate-200 text-slate-700' : 'border-[#182030] text-slate-400'
                }`}>
                  <span>Created Chunks:</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-sky-400'}`}>{nlpAnalysis.chunksCount}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EMBEDDING INSPECTOR */}
        {vectorEmbedding && (
          <div className={`rounded-lg border overflow-hidden ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d121d] border-[#1e2638]'
          }`}>
            <button
              onClick={() => setIsEmbeddingOpen(!isEmbeddingOpen)}
              className={`w-full px-3 py-2 flex items-center justify-between text-[11px] font-bold ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-900' : 'bg-[#101726] hover:bg-[#151f33] text-sky-400'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Binary className="w-3.5 h-3.5" />
                <span>EMBEDDING VECTOR</span>
              </div>
              {isEmbeddingOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {isEmbeddingOpen && (
              <div className="p-3 space-y-3 text-[11px]">
                <div className="flex justify-between">
                  <span className="opacity-70">Model:</span>
                  <span className="font-bold">{vectorEmbedding.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Dimensions:</span>
                  <span className="font-bold">{vectorEmbedding.dimensions}</span>
                </div>

                <div>
                  <span className="opacity-70 block mb-1">Vector Density Waveform:</span>
                  <div className={`h-10 rounded border p-1.5 flex items-end justify-between gap-0.5 ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#05070a] border-[#182030]'
                  }`}>
                    {vectorEmbedding.heatmapValues.map((val, idx) => (
                      <div
                        key={idx}
                        style={{ height: `${val * 100}%` }}
                        className={`w-full rounded-t-xs opacity-80 hover:opacity-100 transition-opacity ${
                          isLight ? 'bg-slate-800' : 'bg-gradient-to-t from-sky-600 to-sky-400'
                        }`}
                        title={`Dim bucket #${idx + 1}: ${val}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
