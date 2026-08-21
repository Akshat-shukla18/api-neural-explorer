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
  theme = 'dark'
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
    <div className={`w-full h-full flex flex-col font-sans select-none overflow-hidden text-xs transition-colors max-w-full min-w-0 ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#090c13] text-slate-100'
    }`}>
      {/* Panel Header */}
      <div className={`h-10 border-b px-4 flex items-center justify-between shrink-0 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0d121d] border-[#1a2234]'
      }`}>
        <div className={`flex items-center gap-2 font-mono font-semibold uppercase tracking-wider truncate ${
          isLight ? 'text-slate-900' : 'text-emerald-400'
        }`}>
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="truncate">QUERY YOUR API</span>
        </div>
        <span className="font-mono text-[10px] opacity-70 shrink-0">RAG & MCP</span>
      </div>

      <div className={`px-4 py-2 border-b font-mono text-[11px] shrink-0 truncate ${
        isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-[#0b0e17] border-[#182030] text-slate-400'
      }`}>
        Ask natural language questions about the connected payload.
      </div>

      {/* Messages Thread Container - Constrained Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar min-h-0 max-w-full">
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
                  className={`p-2 rounded border text-left font-mono text-[11px] transition-all flex items-center justify-between group ${
                    isLight 
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800' 
                      : 'bg-[#07090e] hover:bg-[#131b2c] border-[#182030] text-slate-300'
                  }`}
                >
                  <span className="truncate pr-2">{q}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform opacity-70 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col space-y-1.5 max-w-full ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.sender === 'user' && (
              <div className={`max-w-[90%] p-3 rounded-xl border font-sans shadow-sm break-words ${
                isLight 
                  ? 'bg-slate-900 border-slate-800 text-white' 
                  : 'bg-emerald-950/80 border-emerald-800/80 text-emerald-100'
              }`}>
                <div className={`flex items-center justify-between text-[10px] font-mono mb-1 gap-2 ${
                  isLight ? 'text-slate-300' : 'text-emerald-400'
                }`}>
                  <span>USER</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed break-words">{msg.text}</p>
              </div>
            )}

            {msg.sender === 'assistant' && (
              <div className={`w-full max-w-full p-3 rounded-xl border space-y-3 shadow-sm break-words ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-[#0d121d] border-[#1e2638] text-slate-200'
              }`}>
                <div className={`flex items-center justify-between text-[10px] font-mono ${
                  isLight ? 'text-slate-900 font-bold' : 'text-emerald-400 font-bold'
                }`}>
                  <div className="flex items-center gap-1.5 truncate">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">NEURAL RAG RESPONSE</span>
                  </div>
                  <span className="opacity-70 shrink-0">{msg.timestamp}</span>
                </div>

                <p className="leading-relaxed font-sans break-words">
                  {msg.text}
                </p>

                {msg.mcpToolCall && (
                  <div className={`p-2 rounded border font-mono text-[10px] flex items-center justify-between gap-2 ${
                    isLight 
                      ? 'bg-slate-100 border-slate-300 text-slate-900' 
                      : 'bg-[#07090e] border-emerald-900/60 text-emerald-400'
                  }`}>
                    <div className="flex items-center gap-1.5 truncate">
                      <Server className="w-3 h-3 shrink-0" />
                      <span className="truncate">MCP TOOL: <strong className="truncate">{msg.mcpToolCall.tool}</strong></span>
                    </div>
                    <span className="shrink-0">{msg.mcpToolCall.latencyMs} ms</span>
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
                          className={`p-2 rounded border text-left font-mono text-[11px] transition-all group flex flex-col space-y-1 w-full max-w-full overflow-hidden ${
                            isLight
                              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                              : 'bg-[#05070a] hover:bg-[#101726] border-[#182030] text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="font-bold truncate">
                              {src.name}
                            </span>
                            {src.price && (
                              <span className={`font-bold shrink-0 ${isLight ? 'text-slate-900' : 'text-emerald-400'}`}>
                                ₹{src.price.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] opacity-80 leading-tight line-clamp-2 break-all">
                            {src.snippet}
                          </p>
                          <div className="flex items-center gap-1 text-[9px] opacity-70 pt-0.5">
                            <span>HIGHLIGHT IN JSON</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
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
              : 'bg-[#0d121d] border-emerald-500/40 text-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.2)]'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              <span className={`w-2 h-2 rounded-full animate-ping ${isLight ? 'bg-slate-900' : 'bg-emerald-400'}`} />
              <span>PIPELINE EXECUTING...</span>
            </div>
            <div className={`p-2 rounded border truncate ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-[#05070a] border-[#182030] text-slate-300'
            }`}>
              {activeProcessingStep || "Initializing RAG search..."}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* RAG Context Drawer - Height Constrained */}
      {activeRagChunks && activeRagChunks.length > 0 && (
        <div className={`border-t shrink-0 max-h-36 overflow-hidden flex flex-col ${isLight ? 'border-slate-200 bg-white' : 'border-[#1a2234] bg-[#0b0e17]'}`}>
          <button
            onClick={() => setIsRagDrawerOpen(!isRagDrawerOpen)}
            className={`w-full px-4 py-1.5 border-b flex items-center justify-between text-xs font-mono font-bold shrink-0 ${
              isLight 
                ? 'bg-slate-100 border-slate-200 text-slate-900' 
                : 'bg-[#0d121d] border-[#182030] text-emerald-400'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">RAG CONTEXT (TOP CHUNKS)</span>
            </div>
            {isRagDrawerOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
          </button>

          {isRagDrawerOpen && (
            <div className="p-2 overflow-y-auto space-y-1.5 font-mono text-[10px] custom-scrollbar flex-1">
              {activeRagChunks.map((chunk) => (
                <div key={chunk.id} className={`p-1.5 rounded border space-y-1 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#05070a] border-[#182030]'
                }`}>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold truncate">Chunk #{chunk.chunkNumber}</span>
                    <span className={`font-bold shrink-0 ${isLight ? 'text-slate-900' : 'text-emerald-400'}`}>
                      Similarity: {chunk.similarity}
                    </span>
                  </div>

                  <div className={`w-full h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#131b2c]'}`}>
                    <div
                      style={{ width: `${chunk.similarity * 100}%` }}
                      className={`h-full rounded-full ${isLight ? 'bg-slate-900' : 'bg-emerald-400'}`}
                    />
                  </div>

                  <p className="opacity-80 line-clamp-1 text-[9px] truncate">
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Query Bar - Fixed Bottom Input */}
      <form onSubmit={handleSubmit} className={`p-2.5 border-t shrink-0 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0d121d] border-[#1a2234]'
      }`}>
        <div className={`relative flex items-center rounded-lg border transition-all p-1 ${
          isLight 
            ? 'bg-slate-50 border-slate-300 focus-within:border-slate-900' 
            : 'bg-[#05070a] border-[#1e2638] focus-within:border-emerald-500/80'
        }`}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask something about this API..."
            className={`w-full bg-transparent px-2.5 py-1.5 font-mono text-xs focus:outline-none ${
              isLight ? 'text-slate-900 placeholder-slate-400' : 'text-slate-100 placeholder-slate-600'
            }`}
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className={`px-3 py-1.5 rounded font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
              isLight
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <span>SEND</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
};
