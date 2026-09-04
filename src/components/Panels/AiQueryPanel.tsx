import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Database, 
  ChevronDown, 
  ChevronRight, 
  Server, 
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import type { ChatMessage, RagChunk } from '../../types';

interface AiQueryPanelProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isProcessing: boolean;
  activeProcessingStep?: string;
  activeRagChunks?: RagChunk[];
  onSelectSourceRecord?: (recordId: string | number) => void;
  theme?: 'dark' | 'light';
}

const SAMPLE_QUESTIONS = [
  "Which products cost more than ₹10,000?",
  "Find Nike footwear with max cushioning",
  "Which items are currently in electronics?",
  "Who are the senior infrastructure engineers?"
];

export const AiQueryPanel: React.FC<AiQueryPanelProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  activeProcessingStep,
  activeRagChunks,
  onSelectSourceRecord,
  theme = 'light'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRagDrawerOpen, setIsRagDrawerOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeProcessingStep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleSelectPreset = (question: string) => {
    if (!isProcessing) {
      onSendMessage(question);
    }
  };

  return (
  <div className={`w-full h-full min-h-0 flex flex-col font-sans select-none overflow-hidden text-xs transition-colors ${
  isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#090c13] text-slate-100'
}`}>
      {/* Header */}
      <div className={`h-10 border-b px-4 flex items-center justify-between shrink-0 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0d121d] border-[#1a2234]'
      }`}>
        <div className={`flex items-center gap-2 font-mono font-semibold uppercase tracking-wider ${
          isLight ? 'text-slate-900' : 'text-sky-400'
        }`}>
          <Sparkles className="w-4 h-4" />
          <span>QUERY YOUR API</span>
        </div>
        <span className="font-mono text-[10px] opacity-70 hidden sm:inline">RAG & MCP POWERED</span>
      </div>

      <div className={`px-4 py-2 border-b font-mono text-[11px] shrink-0 ${
        isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-[#0b0e17] border-[#182030] text-slate-400'
      }`}>
        Ask natural language questions about the indexed JSON payload.
      </div>

      {/* Messages */}
     <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar">
        {messages.length <= 1 && (
          <div className={`p-3 rounded-lg border space-y-2 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d121d] border-[#1e2638]'
          }`}>
            <span className="font-mono text-[10px] opacity-70 uppercase tracking-wider block">
              SUGGESTED QUERIES:
            </span>
            <div className="flex flex-col gap-1.5">
              {SAMPLE_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(q)}
                  className={`p-2 rounded border text-left font-mono text-[11px] transition-all flex items-center justify-between gap-2 group ${
                    isLight 
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800' 
                      : 'bg-[#07090e] hover:bg-[#131b2c] border-[#182030] text-slate-300'
                  }`}
                >
                  <span className="leading-snug">{q}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform opacity-70" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.sender === 'user' && (
              <div className={`ml-auto max-w-[85%] p-3 rounded-xl border font-sans shadow-sm ${
                isLight 
                  ? 'bg-slate-900 border-slate-800 text-white' 
                  : 'bg-sky-950/80 border-sky-800/80 text-sky-100'
              }`}>
                <div className={`flex items-center justify-between text-[10px] font-mono mb-1 ${
                  isLight ? 'text-slate-300' : 'text-sky-400'
                }`}>
                  <span>USER</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            )}

            {msg.sender === 'assistant' && (
              <div className={`mr-auto max-w-[95%] p-3 rounded-xl border space-y-3 shadow-sm ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-[#0d121d] border-[#1e2638] text-slate-200'
              }`}>
                <div className={`flex items-center justify-between text-[10px] font-mono ${
                  isLight ? 'text-slate-900 font-bold' : 'text-sky-400 font-bold'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>NEURAL RAG RESPONSE</span>
                  </div>
                  <span className="opacity-70">{msg.timestamp}</span>
                </div>

                <p className="leading-relaxed font-sans">
                  {msg.text}
                </p>

                {msg.mcpToolCall && (
                  <div className={`p-2 rounded border font-mono text-[10px] flex items-center justify-between ${
                    isLight 
                      ? 'bg-slate-100 border-slate-300 text-slate-900' 
                      : 'bg-[#07090e] border-sky-900/60 text-sky-400'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5" />
                      <span>MCP TOOL DISPATCH: <strong>{msg.mcpToolCall.tool}</strong></span>
                    </div>
                    <span>{msg.mcpToolCall.latencyMs} ms</span>
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className={`pt-2 border-t space-y-2 ${isLight ? 'border-slate-200' : 'border-[#182030]'}`}>
                    <span className="font-mono text-[10px] font-bold opacity-70 tracking-wider uppercase block">
                      RETRIEVED SOURCES ({msg.sources.length})
                    </span>

                    <div className="grid grid-cols-1 gap-2">
                      {msg.sources.map((src) => (
                        <button
                          key={src.id}
                          onClick={() => onSelectSourceRecord?.(src.id)}
                          className={`p-2 rounded border text-left font-mono text-[11px] transition-all group flex flex-col space-y-1 ${
                            isLight
                              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                              : 'bg-[#05070a] hover:bg-[#101726] border-[#182030] text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">
                              {src.name}
                            </span>
                            {src.price && (
                              <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-sky-400'}`}>
                                ₹{src.price.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] opacity-80 leading-tight">
                            {src.snippet}
                          </p>
                          <div className="flex items-center gap-1 text-[9px] opacity-70 pt-0.5">
                            <span>HIGHLIGHT IN JSON</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className={`p-3 rounded-xl border font-mono text-[11px] space-y-2 animate-pulse ${
            isLight
              ? 'bg-white border-slate-400 text-slate-900 shadow-md'
              : 'bg-[#0d121d] border-sky-500/40 text-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.2)]'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              <span className={`w-2 h-2 rounded-full animate-ping ${isLight ? 'bg-slate-900' : 'bg-sky-400'}`} />
              <span>PIPELINE EXECUTING...</span>
            </div>
            <div className={`p-2 rounded border ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-[#05070a] border-[#182030] text-slate-300'
            }`}>
              {activeProcessingStep || "Initializing RAG search..."}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* RAG Context Drawer */}
      {activeRagChunks && activeRagChunks.length > 0 && (
        <div className={`border-t shrink-0 ${isLight ? 'border-slate-200 bg-white' : 'border-[#1a2234] bg-[#0b0e17]'}`}>
          <button
            onClick={() => setIsRagDrawerOpen(!isRagDrawerOpen)}
            className={`w-full px-4 py-2 border-b flex items-center justify-between text-xs font-mono font-bold ${
              isLight 
                ? 'bg-slate-100 border-slate-200 text-slate-900' 
                : 'bg-[#0d121d] border-[#182030] text-sky-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              <span>RAG CONTEXT (TOP RETRIEVED CHUNKS)</span>
            </div>
            {isRagDrawerOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {isRagDrawerOpen && (
            <div className="p-3 max-h-40 overflow-y-auto space-y-2 font-mono text-[10px] custom-scrollbar">
              {activeRagChunks.map((chunk) => (
                <div key={chunk.id} className={`p-2 rounded border space-y-1 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#05070a] border-[#182030]'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Chunk #{chunk.chunkNumber}</span>
                    <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-sky-400'}`}>
                      Similarity: {chunk.similarity}
                    </span>
                  </div>

                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#131b2c]'}`}>
                    <div
                      style={{ width: `${chunk.similarity * 100}%` }}
                      className={`h-full rounded-full ${isLight ? 'bg-slate-900' : 'bg-gradient-to-r from-sky-500 to-sky-300'}`}
                    />
                  </div>

                  <p className="opacity-80 line-clamp-2 text-[10px]">
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Query Bar */}
      <form onSubmit={handleSubmit} className={`p-3 border-t shrink-0 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0d121d] border-[#1a2234]'
      }`}>
        <div className={`relative flex items-center rounded-lg border transition-all p-1 ${
          isLight 
            ? 'bg-slate-50 border-slate-300 focus-within:border-slate-900' 
            : 'bg-[#05070a] border-[#1e2638] focus-within:border-sky-500/80'
        }`}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask something about this API..."
            className={`w-full bg-transparent px-3 py-2 font-mono text-xs focus:outline-none ${
              isLight ? 'text-slate-900 placeholder-slate-400' : 'text-slate-100 placeholder-slate-600'
            }`}
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className={`px-4 py-2 rounded font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
              isLight
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
            }`}
          >
            <span>SEND</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
