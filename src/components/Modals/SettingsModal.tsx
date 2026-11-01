import React, { useState } from 'react';
import { X, Sliders, Cpu, Database, Server, Key, Check } from 'lucide-react';
import { getActiveEmbeddingProvider, setEmbeddingProvider, SemanticFeatureProvider } from '../../services/embeddings/embeddingProvider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, theme = 'light' }) => {
  const [activeModel, setActiveModel] = useState<string>('semantic-feature');
  const [metric, setMetric] = useState<string>('cosine');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;
  const isLight = theme === 'light';

  const handleSave = () => {
    if (activeModel === 'semantic-feature') {
      setEmbeddingProvider(new SemanticFeatureProvider());
    }
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-mono text-xs select-none">
      <div className={`max-w-lg w-full rounded-xl border p-6 space-y-6 shadow-2xl transition-colors ${
        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d121d] border-[#232d42] text-slate-100'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 ${
          isLight ? 'border-slate-200' : 'border-[#182030]'
        }`}>
          <div className={`flex items-center gap-2 font-bold tracking-wider ${
            isLight ? 'text-slate-900' : 'text-sky-400'
          }`}>
            <Sliders className="w-4 h-4" />
            <span>SYSTEM & PROTOCOL CONFIGURATION</span>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1 rounded transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings options */}
        <div className="space-y-4">
          
          <div className="space-y-1.5">
            <label className={`font-bold flex items-center gap-2 ${
              isLight ? 'text-slate-800' : 'text-slate-300'
            }`}>
              <Cpu className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-sky-400'}`} />
              <span>Dense Embedding Engine</span>
            </label>
            <select 
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className={`w-full rounded p-2.5 border focus:outline-none transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-900'
                  : 'bg-[#05070a] border-[#1e2638] text-slate-200 focus:border-sky-500'
              }`}
            >
              <option value="semantic-feature">semantic-feature-extractor-384d (High-Dim N-Gram + L2) — Built-in Active</option>
              <option value="minilm">Xenova/all-MiniLM-L6-v2 (384-d Transformers.js ONNX)</option>
              <option value="openai">OpenAI text-embedding-3-small (1536-d Remote)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={`font-bold flex items-center gap-2 ${
              isLight ? 'text-slate-800' : 'text-slate-300'
            }`}>
              <Server className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-sky-400'}`} />
              <span>MCP Protocol Tools Status</span>
            </label>
            <div className={`p-2.5 rounded border flex justify-between items-center ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-[#05070a] border-[#1e2638] text-slate-300'
            }`}>
              <span className="text-[11px]">4 Registered Tools (api.fetch, api.search, api.retrieve, api.filter)</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isLight ? 'bg-slate-900 text-white' : 'bg-sky-950 text-sky-400 border border-sky-500/40'
              }`}>ACTIVE</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`font-bold flex items-center gap-2 ${
              isLight ? 'text-slate-800' : 'text-slate-300'
            }`}>
              <Database className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-sky-400'}`} />
              <span>Vector Similarity Metric</span>
            </label>
            <select 
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className={`w-full rounded p-2.5 border focus:outline-none transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-900'
                  : 'bg-[#05070a] border-[#1e2638] text-slate-200 focus:border-sky-500'
              }`}
            >
              <option value="cosine">Cosine Distance (Normalized Dot Product) — Active</option>
              <option value="euclidean">Euclidean L2 Metric</option>
            </select>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className={`font-bold flex items-center gap-2 ${
              isLight ? 'text-slate-800' : 'text-slate-300'
            }`}>
              <Key className={`w-3.5 h-3.5 ${isLight ? 'text-slate-700' : 'text-slate-400'}`} />
              <span>Optional External LLM Keys</span>
            </label>
            <div className="space-y-2">
              <input 
                type="password"
                placeholder="Google Gemini API Key (Optional — default works keyless)"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className={`w-full rounded p-2 border focus:outline-none text-[11px] ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-[#05070a] border-[#1e2638] text-slate-200 placeholder-slate-600'
                }`}
              />
              <input 
                type="password"
                placeholder="OpenAI API Key (Optional)"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className={`w-full rounded p-2 border focus:outline-none text-[11px] ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-[#05070a] border-[#1e2638] text-slate-200 placeholder-slate-600'
                }`}
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`pt-4 border-t flex items-center justify-between ${
          isLight ? 'border-slate-200' : 'border-[#182030]'
        }`}>
          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Keys stay in browser memory only
          </span>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              savedNotice
                ? 'bg-emerald-600 text-white'
                : isLight
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
            }`}
          >
            {savedNotice ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>SAVED</span>
              </>
            ) : (
              <span>SAVE CONFIG</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
