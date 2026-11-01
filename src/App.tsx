import { useState, useCallback, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroConnect } from './components/HeroConnect';
import { SystemGraph } from './components/SystemGraph/SystemGraph';
import { ApiDataPanel } from './components/Panels/ApiDataPanel';
import { AiQueryPanel } from './components/Panels/AiQueryPanel';
import { LiveTraceConsole } from './components/Panels/LiveTraceConsole';
import { ErrorStateModal } from './components/Modals/ErrorStateModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { FileText, Cpu, Terminal, Sparkles, LayoutGrid, Layers } from 'lucide-react';

import type { 
  AppState, 
  StageId, 
  PipelineNodeData, 
  TraceLog, 
  ApiFetchResult, 
  NlpAnalysis, 
  VectorEmbedding, 
  RagChunk, 
  ChatMessage,
  DataSourceMode,
  VectorRecord
} from './types';

import { fetchApiData } from './services/apiService';
import { processNlpData } from './services/nlpService';
import { processRecordsIntoChunks } from './services/jsonProcessingService';
import { createVectorEmbedding } from './services/vectorService';
import { getActiveEmbeddingProvider } from './services/embeddings/embeddingProvider';
import { globalVectorStore } from './services/vectorStore/indexedDbVectorStore';
import { processAiQuery } from './services/ragService';

const INITIAL_STAGES: Record<StageId, PipelineNodeData> = {
  api: { id: 'api', label: 'API INGESTION', category: 'api', status: 'WAITING' },
  json_parser: { id: 'json_parser', label: 'JSON PARSER', category: 'api', status: 'WAITING' },
  nlp: { id: 'nlp', label: 'NLP PREPROCESSOR', category: 'nlp', status: 'WAITING' },
  tokenizer: { id: 'tokenizer', label: 'TOKENIZER', category: 'nlp', status: 'WAITING' },
  chunker: { id: 'chunker', label: 'CHUNKER', category: 'nlp', status: 'WAITING' },
  embedding: { id: 'embedding', label: 'EMBEDDING ENGINE', category: 'embedding', status: 'WAITING' },
  vector_db: { id: 'vector_db', label: 'VECTOR DATABASE', category: 'vector', status: 'WAITING' },
  mcp_server: { id: 'mcp_server', label: 'MCP SERVER', category: 'mcp', status: 'WAITING' },
  rag: { id: 'rag', label: 'RAG RETRIEVAL', category: 'rag', status: 'WAITING' },
  llm: { id: 'llm', label: 'LLM INFERENCE', category: 'llm', status: 'WAITING' }
};

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [appState, setAppState] = useState<AppState>('DISCONNECTED');
  const [stageStates, setStageStates] = useState<Record<StageId, PipelineNodeData>>(INITIAL_STAGES);
  const [traceLogs, setTraceLogs] = useState<TraceLog[]>([]);

  const [apiData, setApiData] = useState<ApiFetchResult | null>(null);
  const [nlpAnalysis, setNlpAnalysis] = useState<NlpAnalysis | null>(null);
  const [vectorEmbedding, setVectorEmbedding] = useState<VectorEmbedding | null>(null);
  const [ragChunks, setRagChunks] = useState<RagChunk[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | number | undefined>(undefined);

  const [isQueryProcessing, setIsQueryProcessing] = useState(false);
  const [activeProcessingStep, setActiveProcessingStep] = useState<string | undefined>(undefined);
  const [activeToolCall, setActiveToolCall] = useState<string | undefined>(undefined);
  const [activeRagChunks, setActiveRagChunks] = useState<RagChunk[]>([]);

  const [mobileTab, setMobileTab] = useState<'api' | 'graph' | 'trace' | 'chat'>('api');
  const [mobileViewMode, setMobileViewMode] = useState<'slide' | 'stack'>('slide');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastAttemptedUrl, setLastAttemptedUrl] = useState<string>('');
  const [lastAttemptedMode, setLastAttemptedMode] = useState<DataSourceMode>('live');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addLog = useCallback((stage: string, level: TraceLog['level'], message: string, details?: string) => {
    const newLog: TraceLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      stage,
      level,
      message,
      details
    };
    setTraceLogs(prev => [...prev, newLog]);
  }, []);

  const updateStage = useCallback((stageId: StageId, status: PipelineNodeData['status'], metrics?: PipelineNodeData['metrics']) => {
    setStageStates(prev => ({
      ...prev,
      [stageId]: {
        ...prev[stageId],
        status,
        metrics: metrics ? { ...prev[stageId].metrics, ...metrics } : prev[stageId].metrics
      }
    }));
  }, []);

  const runPipelineProcess = async (url: string, mode: DataSourceMode = 'live') => {
    setLastAttemptedUrl(url);
    setLastAttemptedMode(mode);
    setAppState('PROCESSING');
    setStageStates(INITIAL_STAGES);
    setTraceLogs([]);
    setErrorMessage(null);

    try {
      // 1. Live API Ingestion
      updateStage('api', 'PROCESSING');
      addLog('API_REQUEST', 'info', `GET ${url} [Mode: ${mode.toUpperCase()}]`, 'Initiating genuine HTTP fetch');

      const fetchResult = await fetchApiData(url, { mode });
      setApiData(fetchResult);

      updateStage('api', 'COMPLETE', { 
        recordsCount: fetchResult.recordsCount, 
        latencyMs: fetchResult.responseTimeMs 
      });
      addLog('API_RESPONSE', 'success', `${fetchResult.status} ${fetchResult.statusText}`, `${fetchResult.recordsCount} records fetched in ${fetchResult.responseTimeMs}ms (${fetchResult.dataSizeBytes} bytes)`);

      // 2. JSON Parser AST
      updateStage('json_parser', 'PROCESSING');
      addLog('JSON_PARSER', 'info', 'Parsing structural JSON AST & field paths', `${fetchResult.fieldsCount} unique fields, ${fetchResult.nestedFieldsCount} nested objects`);
      updateStage('json_parser', 'COMPLETE', { fieldsCount: fetchResult.fieldsCount });
      addLog('JSON_PARSED', 'success', 'Schema structure validated', `Discovered ${(fetchResult.fieldPaths || []).length} field paths`);

      // 3. NLP Tokenization & Vocabulary
      updateStage('nlp', 'PROCESSING');
      addLog('NLP_PROCESSING', 'info', 'Tokenization & stopword removal started');
      const { analysis } = processNlpData(fetchResult.data);
      setNlpAnalysis(analysis);
      updateStage('nlp', 'COMPLETE', { tokensCount: analysis.tokens.length });
      addLog('NLP_COMPLETE', 'success', `${analysis.tokens.length} raw tokens processed`, `Vocabulary: ${analysis.vocabularySize} words`);

      // 4. Tokenizer
      updateStage('tokenizer', 'PROCESSING');
      updateStage('tokenizer', 'COMPLETE', { tokensCount: analysis.lemmatizedTokens.length });
      addLog('TOKENIZER', 'info', 'Lemmatized tokens produced', `Sample: [${analysis.lemmatizedTokens.slice(0, 4).join(', ')}]`);

      // 5. Deterministic Chunking
      updateStage('chunker', 'PROCESSING');
      const { chunks } = processRecordsIntoChunks(fetchResult.data, { sourceUrl: fetchResult.url });
      setRagChunks(chunks);
      updateStage('chunker', 'COMPLETE', { chunksCount: chunks.length });
      addLog('CHUNKING', 'success', `${chunks.length} bounded sliding-window RAG chunks created`);

      // 6. Embedding Generation
      updateStage('embedding', 'PROCESSING');
      const embeddingProvider = getActiveEmbeddingProvider();
      addLog('EMBEDDINGS', 'info', `Calculating ${embeddingProvider.dimensions}-d embeddings with ${embeddingProvider.modelId}`);

      const embedStart = performance.now();
      const embeddingObj = await createVectorEmbedding(analysis.sampleText);
      const embedLatency = Math.round(performance.now() - embedStart);
      setVectorEmbedding(embeddingObj);
      updateStage('embedding', 'COMPLETE', { dimensions: embeddingProvider.dimensions, latencyMs: embedLatency });
      addLog('EMBEDDINGS_DONE', 'success', `${embeddingProvider.dimensions}-d vectors generated in ${embedLatency}ms`);

      // 7. Vector Store Indexing
      updateStage('vector_db', 'PROCESSING');
      addLog('VECTOR_INDEX', 'info', `Indexing ${chunks.length} chunks into persistent IndexedDB store`);
      const indexStart = performance.now();
      const chunkTexts = chunks.map(c => c.content);
      const chunkEmbeddings = await embeddingProvider.embedDocuments(chunkTexts);

      const vectorRecords: VectorRecord[] = chunks.map((c, idx) => ({
        id: c.id,
        chunkId: c.id,
        sourceId: fetchResult.url,
        sourceUrl: fetchResult.url,
        recordId: c.recordId,
        content: c.content,
        fieldPaths: c.fieldPaths,
        embedding: chunkEmbeddings[idx] || [],
        modelId: embeddingProvider.modelId,
        dimensions: embeddingProvider.dimensions,
        timestamp: Date.now(),
        contentHash: c.contentHash,
        metadata: { ...c.metadata, title: c.recordTitle, price: c.price, category: c.category }
      }));

      await globalVectorStore.reindexSource(fetchResult.url, vectorRecords);
      const indexLatency = Math.round(performance.now() - indexStart);
      updateStage('vector_db', 'COMPLETE', { latencyMs: indexLatency });
      addLog('VECTOR_DB', 'success', `${chunks.length} vectors indexed into store in ${indexLatency}ms`);

      // 8. MCP Server & Tool Registry
      updateStage('mcp_server', 'PROCESSING');
      addLog('MCP_SERVER', 'mcp', 'Model Context Protocol server online', 'Active tools: api.fetch(), api.search(), api.retrieve(), api.filter()');
      updateStage('mcp_server', 'COMPLETE');

      // 9. RAG & LLM
      updateStage('rag', 'COMPLETE');
      updateStage('llm', 'COMPLETE');

      addLog('SYSTEM_READY', 'success', 'API Neural Network pipeline fully initialized', 'Ready for live queries.');

      setMessages([
        {
          id: 'welcome-msg',
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `API pipeline successfully connected! Indexed ${fetchResult.recordsCount} records into ${chunks.length} vector chunks with real MCP tool bindings active.`
        }
      ]);

      setAppState('READY');

    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect to specified JSON API URL.');
      setAppState('ERROR');
      addLog('API_ERROR', 'error', 'API connection failed', err.message);
    }
  };

  const handleSendMessage = async (userQuery: string) => {
    if (!apiData || ragChunks.length === 0 || isQueryProcessing) return;

    setIsQueryProcessing(true);
    addLog('USER_QUERY', 'info', `Query: "${userQuery}"`);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: userQuery
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const { message, retrievedChunks } = await processAiQuery(
        userQuery,
        apiData.data,
        ragChunks,
        (step) => {
          setActiveProcessingStep(step);
          if (step.includes('MCP:')) {
            const toolMatch = step.match(/api\.[a-z]+\(\)/i);
            const tool = toolMatch ? toolMatch[0] : 'api.search()';
            setActiveToolCall(tool);
            addLog('MCP_TOOL', 'mcp', `Executing MCP tool call: ${tool}`);
          } else if (step.includes('Analyzing')) {
            addLog('QUERY_PLAN', 'info', 'Parsing query intent & generating execution AST');
          } else if (step.includes('Synthesizing')) {
            addLog('LLM', 'success', 'Generating grounded answer with citations');
          }
        }
      );

      setActiveRagChunks(retrievedChunks);
      setMessages(prev => [...prev, message]);
      addLog('LLM_RESPONSE', 'success', `Response generated with ${message.sources?.length || 0} source citations`);

    } catch (err: any) {
      addLog('QUERY_ERROR', 'error', 'Failed to process AI query', err.message);
    } finally {
      setIsQueryProcessing(false);
      setActiveProcessingStep(undefined);
      setActiveToolCall(undefined);
    }
  };

  const handleSelectSourceRecord = (recordId: string | number) => {
    setHighlightedRecordId(recordId);
    addLog('INSPECT_RECORD', 'info', `Inspecting JSON record #${recordId}`);
  };

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden transition-colors ${
    theme === 'light'
      ? 'bg-slate-50 text-slate-900'
      : 'bg-[#07090e] text-slate-100'
    }`}>
      <Navbar
        apiStatus={appState === 'READY' ? 'ONLINE' : appState === 'PROCESSING' ? 'STANDBY' : 'ERROR'}
        mcpStatus={appState === 'READY' ? 'ACTIVE' : 'IDLE'}
        ragStatus={appState === 'READY' ? 'INDEXED' : 'UNINDEXED'}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {appState === 'DISCONNECTED' && (
        <HeroConnect
          onConnect={runPipelineProcess}
          isLoading={false}
          theme={theme}
        />
      )}

      {(appState === 'PROCESSING' || appState === 'READY') && (
        <div className="flex-1 flex flex-col min-h-0 max-w-full overflow-hidden">
          
          {/* Mobile Navigation Header (< md) */}
          <div className={`md:hidden flex items-center justify-between border-b px-2 py-1.5 shrink-0 z-40 ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0d121d] border-[#1e2638]'
          }`}>
            {/* Scrollable Tab Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-[calc(100%-48px)]">
              <button
                onClick={() => setMobileTab('api')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-semibold whitespace-nowrap transition-all ${
                  mobileTab === 'api'
                    ? theme === 'light'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-sky-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : theme === 'light'
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-[#131b2c] text-slate-300 hover:bg-[#1a253c]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>API Data</span>
                {apiData && (
                  <span className={`text-[9px] px-1 rounded ${
                    mobileTab === 'api' 
                      ? theme === 'light' ? 'bg-slate-700 text-white' : 'bg-sky-900 text-sky-200'
                      : theme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-[#1e2a42] text-slate-400'
                  }`}>
                    {apiData.recordsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileTab('graph')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-semibold whitespace-nowrap transition-all ${
                  mobileTab === 'graph'
                    ? theme === 'light'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-sky-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : theme === 'light'
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-[#131b2c] text-slate-300 hover:bg-[#1a253c]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span>Pipeline</span>
                {activeToolCall && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>

              <button
                onClick={() => setMobileTab('chat')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-semibold whitespace-nowrap transition-all ${
                  mobileTab === 'chat'
                    ? theme === 'light'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-sky-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : theme === 'light'
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-[#131b2c] text-slate-300 hover:bg-[#1a253c]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>AI Query</span>
                {isQueryProcessing && (
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setMobileTab('trace')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-semibold whitespace-nowrap transition-all ${
                  mobileTab === 'trace'
                    ? theme === 'light'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-sky-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : theme === 'light'
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-[#131b2c] text-slate-300 hover:bg-[#1a253c]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 shrink-0" />
                <span>Trace</span>
                <span className={`text-[9px] px-1 rounded ${
                  mobileTab === 'trace'
                    ? theme === 'light' ? 'bg-slate-700 text-white' : 'bg-sky-900 text-sky-200'
                    : theme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-[#1e2a42] text-slate-400'
                }`}>
                  {traceLogs.length}
                </span>
              </button>
            </div>

            {/* View Mode Toggle: Slide Tabs vs All Sections Stacked */}
            <button
              onClick={() => setMobileViewMode(prev => prev === 'slide' ? 'stack' : 'slide')}
              className={`p-1.5 rounded-lg border text-[10px] font-mono flex items-center gap-1 shrink-0 ${
                mobileViewMode === 'stack'
                  ? theme === 'light'
                    ? 'bg-slate-200 border-slate-400 text-slate-900'
                    : 'bg-sky-950 border-sky-500 text-sky-300'
                  : theme === 'light'
                    ? 'bg-slate-100 border-slate-300 text-slate-600'
                    : 'bg-[#131b2c] border-[#1e2638] text-slate-400'
              }`}
              title={mobileViewMode === 'slide' ? 'Switch to All Sections Scroll View' : 'Switch to Focused Tab Slide View'}
            >
              {mobileViewMode === 'slide' ? <Layers className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">{mobileViewMode === 'slide' ? 'Slide' : 'All'}</span>
            </button>
          </div>

          {/* Mobile Content Display (< md) */}
          <div className="md:hidden flex-1 min-h-0 flex flex-col overflow-hidden">
            {mobileViewMode === 'slide' ? (
              // Focused Single Tab View (Full Mobile Viewport Height, crisp and uncluttered)
              <div className="flex-1 min-h-0 h-full w-full overflow-hidden flex flex-col">
                {mobileTab === 'api' && (
                  <div className="flex-1 min-h-0 h-full overflow-hidden flex flex-col">
                    <ApiDataPanel
                      apiData={apiData}
                      nlpAnalysis={nlpAnalysis}
                      vectorEmbedding={vectorEmbedding}
                      highlightedRecordId={highlightedRecordId}
                      theme={theme}
                    />
                  </div>
                )}
                {mobileTab === 'graph' && (
                  <div className="flex-1 min-h-0 h-full overflow-hidden flex flex-col">
                    <SystemGraph
                      stageStates={stageStates}
                      activeToolCall={activeToolCall}
                      theme={theme}
                    />
                  </div>
                )}
                {mobileTab === 'chat' && (
                  <div className="flex-1 min-h-0 h-full overflow-hidden flex flex-col">
                    <AiQueryPanel
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      isProcessing={isQueryProcessing}
                      activeProcessingStep={activeProcessingStep}
                      activeRagChunks={activeRagChunks}
                      onSelectSourceRecord={handleSelectSourceRecord}
                      theme={theme}
                      apiRecords={apiData?.data}
                      apiFields={apiData?.fieldPaths}
                    />
                  </div>
                )}
                {mobileTab === 'trace' && (
                  <div className="flex-1 min-h-0 h-full overflow-hidden flex flex-col">
                    <LiveTraceConsole
                      logs={traceLogs}
                      onClearLogs={() => setTraceLogs([])}
                      theme={theme}
                    />
                  </div>
                )}
              </div>
            ) : (
              // Continuous All-Sections Stacked View with Sliding/Scroll (clearly visible blocks)
              <div className="flex-1 overflow-y-auto min-h-0 space-y-4 p-2 sm:p-3 custom-scrollbar">
                
                {/* 1. API Data Block */}
                <div className={`rounded-xl border overflow-hidden shadow-sm h-[480px] flex flex-col ${
                  theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#090c13] border-[#1e2638]'
                }`}>
                  <ApiDataPanel
                    apiData={apiData}
                    nlpAnalysis={nlpAnalysis}
                    vectorEmbedding={vectorEmbedding}
                    highlightedRecordId={highlightedRecordId}
                    theme={theme}
                  />
                </div>

                {/* 2. System Graph Block */}
                <div className={`rounded-xl border overflow-hidden shadow-sm h-[520px] flex flex-col ${
                  theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#07090e] border-[#1e2638]'
                }`}>
                  <SystemGraph
                    stageStates={stageStates}
                    activeToolCall={activeToolCall}
                    theme={theme}
                  />
                </div>

                {/* 3. AI Query Chat Block */}
                <div className={`rounded-xl border overflow-hidden shadow-sm h-[580px] flex flex-col ${
                  theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#090c13] border-[#1e2638]'
                }`}>
                  <AiQueryPanel
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isProcessing={isQueryProcessing}
                    activeProcessingStep={activeProcessingStep}
                    activeRagChunks={activeRagChunks}
                    onSelectSourceRecord={handleSelectSourceRecord}
                    theme={theme}
                    apiRecords={apiData?.data}
                    apiFields={apiData?.fieldPaths}
                  />
                </div>

                {/* 4. Live Trace Console Block */}
                <div className={`rounded-xl border overflow-hidden shadow-sm h-[340px] flex flex-col ${
                  theme === 'light' ? 'bg-slate-900 border-slate-700' : 'bg-[#05070a] border-[#1e2638]'
                }`}>
                  <LiveTraceConsole
                    logs={traceLogs}
                    onClearLogs={() => setTraceLogs([])}
                    theme={theme}
                  />
                </div>

              </div>
            )}
          </div>

          {/* Desktop Workstation Layout (md: and up) */}
          <div className="hidden md:flex flex-1 flex-row min-h-0 md:h-[calc(100vh-4rem)] max-w-full overflow-hidden">
            
            {/* Left Side (API Data, System Graph, Live Trace) */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden md:w-3/4">
              
              {/* Top Section */}
              <div className="flex-1 grid grid-cols-8 overflow-hidden min-h-0">
                <div className="col-span-3 h-full max-h-full overflow-hidden min-w-0 max-w-full min-h-0 flex flex-col border-r border-slate-200 dark:border-slate-800">
                  <ApiDataPanel
                    apiData={apiData}
                    nlpAnalysis={nlpAnalysis}
                    vectorEmbedding={vectorEmbedding}
                    highlightedRecordId={highlightedRecordId}
                    theme={theme}
                  />
                </div>

                <div className="col-span-5 h-full max-h-full overflow-hidden min-w-0 max-w-full min-h-0 flex flex-col">
                  <SystemGraph
                    stageStates={stageStates}
                    activeToolCall={activeToolCall}
                    theme={theme}
                  />
                </div>
              </div>

              {/* Bottom Section (Live Trace) */}
              <div className="h-40 shrink-0 min-w-0 max-w-full overflow-hidden border-t border-slate-200 dark:border-slate-800">
                <LiveTraceConsole
                  logs={traceLogs}
                  onClearLogs={() => setTraceLogs([])}
                  theme={theme}
                />
              </div>
              
            </div>

            {/* Right Side (AI Query Panel - Full Height) */}
            <div className="w-1/4 h-full flex flex-col min-w-0 min-h-0 border-l border-slate-200 dark:border-slate-800">
              <AiQueryPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isProcessing={isQueryProcessing}
                activeProcessingStep={activeProcessingStep}
                activeRagChunks={activeRagChunks}
                onSelectSourceRecord={handleSelectSourceRecord}
                theme={theme}
                apiRecords={apiData?.data}
                apiFields={apiData?.fieldPaths}
              />
            </div>

          </div>

        </div>
      )}

      {appState === 'ERROR' && errorMessage && (
        <ErrorStateModal
          errorMessage={errorMessage}
          onRetry={() => runPipelineProcess(lastAttemptedUrl || 'https://jsonplaceholder.typicode.com/posts', lastAttemptedMode)}
          onUseSampleData={() => runPipelineProcess('https://api.example.com/v1/products', 'demo')}
          onClose={() => setAppState('DISCONNECTED')}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
      />
    </div>
  );
}

export default App;
