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
  onSelectSourceRecord
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRagDrawerOpen, setIsRagDrawerOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <div className="w-full h-full bg-[#090c13] flex flex-col font-sans select-none overflow-hidden text-xs">
      <div className="h-10 border-b border-[#1a2234] bg-[#0d121d] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-indigo-400 font-mono font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>QUERY YOUR API</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">RAG & MCP POWERED</span>
      </div>

      <div className="px-4 py-2 bg-[#0b0e17] border-b border-[#182030] text-[11px] text-slate-400 font-mono">
        Ask natural language questions about the indexed JSON payload.
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length <= 1 && (
          <div className="p-3 rounded-lg bg-[#0d121d] border border-[#1e2638] space-y-2">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider block">
              SUGGESTED QUERIES:
            </span>
            <div className="flex flex-col gap-1.5">
              {SAMPLE_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(q)}
                  className="p-2 rounded bg-[#07090e] hover:bg-[#131b2c] border border-[#182030] hover:border-indigo-500/40 text-left font-mono text-[11px] text-slate-300 hover:text-indigo-300 transition-all flex items-center justify-between group"
                >
                  <span>{q}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
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
              <div className="ml-auto max-w-[85%] p-3 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-100 font-sans shadow-md">
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-1">
                  <span>USER</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            )}

            {msg.sender === 'assistant' && (
              <div className="mr-auto max-w-[95%] p-3 rounded-xl bg-[#0d121d] border border-[#1e2638] text-slate-200 space-y-3 shadow-md">
                <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-bold">NEURAL RAG RESPONSE</span>
                  </div>
                  <span>{msg.timestamp}</span>
                </div>

                <p className="leading-relaxed font-sans text-slate-200">
                  {msg.text}
                </p>

                {msg.mcpToolCall && (
                  <div className="p-2 rounded bg-[#07090e] border border-emerald-900/60 font-mono text-[10px] flex items-center justify-between text-emerald-400">
                    <div className="flex items-center gap-1.5">
                      <Server className="w-3 h-3 text-emerald-400" />
                      <span>MCP TOOL DISPATCH: <strong className="text-emerald-300">{msg.mcpToolCall.tool}</strong></span>
                    </div>
                    <span>{msg.mcpToolCall.latencyMs} ms</span>
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-[#182030] space-y-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                      RETRIEVED SOURCES ({msg.sources.length})
                    </span>

                    <div className="grid grid-cols-1 gap-2">
                      {msg.sources.map((src) => (
                        <button
                          key={src.id}
                          onClick={() => onSelectSourceRecord?.(src.id)}
                          className="p-2 rounded bg-[#05070a] hover:bg-[#101726] border border-[#182030] hover:border-cyan-500/50 text-left font-mono text-[11px] transition-all group flex flex-col space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-300 font-bold group-hover:text-cyan-200">
                              {src.name}
                            </span>
                            {src.price && (
                              <span className="text-emerald-400 font-bold">
                                ₹{src.price.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {src.snippet}
                          </p>
                          <div className="flex items-center gap-1 text-[9px] text-cyan-400/80 pt-0.5">
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
          <div className="p-3 rounded-xl bg-[#0d121d] border border-cyan-500/40 font-mono text-[11px] space-y-2 animate-pulse shadow-[0_0_16px_rgba(6,182,212,0.15)]">
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-bold">PIPELINE EXECUTING...</span>
            </div>
            <div className="p-2 rounded bg-[#05070a] border border-[#182030] text-slate-300">
              {activeProcessingStep || "Initializing RAG search..."}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {activeRagChunks && activeRagChunks.length > 0 && (
        <div className="border-t border-[#1a2234] bg-[#0b0e17] shrink-0">
          <button
            onClick={() => setIsRagDrawerOpen(!isRagDrawerOpen)}
            className="w-full px-4 py-2 bg-[#0d121d] hover:bg-[#131b2c] flex items-center justify-between text-xs font-mono font-bold text-pink-400 border-b border-[#182030]"
          >
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-pink-400" />
              <span>RAG CONTEXT (TOP RETRIEVED CHUNKS)</span>
            </div>
            {isRagDrawerOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {isRagDrawerOpen && (
            <div className="p-3 max-h-40 overflow-y-auto space-y-2 font-mono text-[10px] custom-scrollbar">
              {activeRagChunks.map((chunk) => (
                <div key={chunk.id} className="p-2 rounded bg-[#05070a] border border-[#182030] space-y-1">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-bold text-pink-300">Chunk #{chunk.chunkNumber}</span>
                    <span className="text-emerald-400 font-bold">Similarity: {chunk.similarity}</span>
                  </div>

                  <div className="w-full h-1.5 bg-[#131b2c] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${chunk.similarity * 100}%` }}
                      className="h-full bg-gradient-to-r from-pink-500 to-emerald-400 rounded-full"
                    />
                  </div>

                  <p className="text-slate-400 line-clamp-2 text-[10px]">
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-3 bg-[#0d121d] border-t border-[#1a2234] shrink-0">
        <div className="relative flex items-center rounded-lg bg-[#05070a] border border-[#1e2638] focus-within:border-indigo-500/80 transition-all p-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask something about this API..."
            className="w-full bg-transparent px-3 py-2 font-mono text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <span>SEND</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
