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
}

export const ApiDataPanel: React.FC<ApiDataPanelProps> = ({
  apiData,
  nlpAnalysis,
  vectorEmbedding,
  highlightedRecordId
}) => {
  const [copied, setCopied] = useState(false);
  const [isNlpOpen, setIsNlpOpen] = useState(true);
  const [isEmbeddingOpen, setIsEmbeddingOpen] = useState(true);
  const [isJsonFolded, setIsJsonFolded] = useState(false);

  const handleCopyJson = () => {
    if (apiData?.rawJson) {
      navigator.clipboard.writeText(apiData.rawJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!apiData) {
    return (
      <div className="w-full h-full bg-[#090c13] border-r border-[#1a2234] p-4 font-mono text-xs text-slate-500 flex items-center justify-center">
        <span>No API connected yet.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#090c13] border-r border-[#1a2234] flex flex-col font-mono text-xs select-none overflow-hidden">
      <div className="h-10 border-b border-[#1a2234] bg-[#0d121d] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>API RESPONSE</span>
        </div>
        <button
          onClick={handleCopyJson}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-[#131b2c] border border-[#1e2638] transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'COPIED' : 'COPY JSON'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <div className="p-3 rounded-lg bg-[#0d121d] border border-[#1e2638] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-bold">{apiData.status} {apiData.statusText}</span>
            </div>
            <span className="text-slate-400 text-[11px]">{apiData.responseTimeMs} ms</span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-400 pt-1 border-t border-[#182030]">
            <div className="truncate">
              <span className="text-slate-500">Endpoint: </span>
              <span className="text-cyan-300 font-semibold">{apiData.url}</span>
            </div>
            <div className="flex justify-between">
              <div>
                <span className="text-slate-500">Records: </span>
                <span className="text-slate-200 font-semibold">{apiData.recordsCount}</span>
              </div>
              <div>
                <span className="text-slate-500">Size: </span>
                <span className="text-slate-200 font-semibold">{(apiData.dataSizeBytes / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-[#05070a] border border-[#1a2234] overflow-hidden">
          <div className="px-3 py-1.5 bg-[#0d121d] border-b border-[#182030] flex items-center justify-between text-[11px] text-slate-400">
            <span>JSON PAYLOAD</span>
            <button
              onClick={() => setIsJsonFolded(!isJsonFolded)}
              className="text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              {isJsonFolded ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>{isJsonFolded ? 'EXPAND' : 'COLLAPSE'}</span>
            </button>
          </div>

          {!isJsonFolded && (
            <div className="p-3 max-h-56 overflow-auto text-[11px] font-mono leading-relaxed bg-[#05070a] custom-scrollbar text-slate-300">
              <pre className="whitespace-pre-wrap">
                {apiData.data.slice(0, 3).map((record, i) => {
                  const isHighlighted = highlightedRecordId !== undefined && String(record.id) === String(highlightedRecordId);
                  return (
                    <div 
                      key={record.id || i}
                      className={`p-1.5 rounded transition-colors my-1 ${
                        isHighlighted 
                          ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                          : 'hover:bg-[#0d121d]'
                      }`}
                    >
                      {JSON.stringify(record, null, 2)}
                    </div>
                  );
                })}
                {apiData.data.length > 3 && (
                  <span className="text-slate-600 italic">
                    ... +{apiData.data.length - 3} more records
                  </span>
                )}
              </pre>
            </div>
          )}
        </div>

        <div className="p-3 rounded-lg bg-[#0d121d] border border-[#1e2638] space-y-2">
          <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] block">
            DATA PROFILE
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-[#07090e] border border-[#161f30]">
              <span className="text-slate-500 block">Records</span>
              <span className="text-slate-100 font-bold text-sm">{apiData.recordsCount}</span>
            </div>
            <div className="p-2 rounded bg-[#07090e] border border-[#161f30]">
              <span className="text-slate-500 block">Fields</span>
              <span className="text-slate-100 font-bold text-sm">{apiData.fieldsCount}</span>
            </div>
            <div className="p-2 rounded bg-[#07090e] border border-[#161f30]">
              <span className="text-slate-500 block">Nested Fields</span>
              <span className="text-slate-100 font-bold text-sm">{apiData.nestedFieldsCount}</span>
            </div>
            <div className="p-2 rounded bg-[#07090e] border border-[#161f30]">
              <span className="text-slate-500 block">Null Values</span>
              <span className="text-slate-100 font-bold text-sm">{apiData.nullValuesCount}</span>
            </div>
          </div>
          <div className="p-2 rounded bg-[#07090e] border border-[#161f30] flex justify-between items-center text-[11px]">
            <span className="text-slate-500">Data Size</span>
            <span className="text-cyan-400 font-bold">{(apiData.dataSizeBytes / 1024).toFixed(1)} KB</span>
          </div>
        </div>

        {nlpAnalysis && (
          <div className="rounded-lg bg-[#0d121d] border border-[#1e2638] overflow-hidden">
            <button
              onClick={() => setIsNlpOpen(!isNlpOpen)}
              className="w-full px-3 py-2 bg-[#101726] hover:bg-[#151f33] flex items-center justify-between text-[11px] font-bold text-purple-400"
            >
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>NLP INSPECTOR</span>
              </div>
              {isNlpOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {isNlpOpen && (
              <div className="p-3 space-y-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block mb-1">Original Sample:</span>
                  <p className="p-2 rounded bg-[#05070a] border border-[#182030] text-slate-300 italic">
                    "{nlpAnalysis.sampleText}"
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Tokens:</span>
                  <div className="flex flex-wrap gap-1">
                    {nlpAnalysis.tokens.map((t, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Stopwords Removed:</span>
                  <div className="flex flex-wrap gap-1">
                    {nlpAnalysis.stopwordsRemoved.map((t, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-[#131b2c] border border-[#1e2638] text-slate-300 text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Lemmatized:</span>
                  <div className="flex flex-wrap gap-1">
                    {nlpAnalysis.lemmatizedTokens.map((t, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-1 border-t border-[#182030] text-slate-400">
                  <span>Created Chunks:</span>
                  <span className="text-purple-400 font-bold">{nlpAnalysis.chunksCount}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {vectorEmbedding && (
          <div className="rounded-lg bg-[#0d121d] border border-[#1e2638] overflow-hidden">
            <button
              onClick={() => setIsEmbeddingOpen(!isEmbeddingOpen)}
              className="w-full px-3 py-2 bg-[#101726] hover:bg-[#151f33] flex items-center justify-between text-[11px] font-bold text-blue-400"
            >
              <div className="flex items-center gap-1.5">
                <Binary className="w-3.5 h-3.5 text-blue-400" />
                <span>EMBEDDING VECTOR</span>
              </div>
              {isEmbeddingOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {isEmbeddingOpen && (
              <div className="p-3 space-y-3 text-[11px]">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Model:</span>
                  <span className="text-blue-300 font-bold">{vectorEmbedding.model}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Dimensions:</span>
                  <span className="text-slate-200 font-bold">{vectorEmbedding.dimensions}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-emerald-400 font-bold">{vectorEmbedding.status}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Vector Sample (384-d):</span>
                  <div className="p-2 rounded bg-[#05070a] border border-[#182030] text-blue-300 font-mono text-[10px] break-all">
                    [{vectorEmbedding.sampleVector.join(', ')}, ...]
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1.5">Vector Density Waveform:</span>
                  <div className="h-10 bg-[#05070a] rounded border border-[#182030] p-1.5 flex items-end justify-between gap-0.5">
                    {vectorEmbedding.heatmapValues.map((val, idx) => (
                      <div
                        key={idx}
                        style={{ height: `${val * 100}%` }}
                        className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-xs opacity-80 hover:opacity-100 transition-opacity"
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
