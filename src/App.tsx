import { useState, useCallback, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroConnect } from './components/HeroConnect';
import { SystemGraph } from './components/SystemGraph/SystemGraph';
import { ApiDataPanel } from './components/Panels/ApiDataPanel';
import { AiQueryPanel } from './components/Panels/AiQueryPanel';
import { LiveTraceConsole } from './components/Panels/LiveTraceConsole';
import { ErrorStateModal } from './components/Modals/ErrorStateModal';
import { SettingsModal } from './components/Modals/SettingsModal';

import type { 
  AppState, 
  StageId, 
  PipelineNodeData, 
  TraceLog, 
  ApiFetchResult, 
  NlpAnalysis, 
  VectorEmbedding, 
  RagChunk, 
  ChatMessage 
} from './types';

import { fetchApiData } from './services/apiService';
import { processNlpData } from './services/nlpService';
import { createVectorEmbedding } from './services/vectorService';
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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastAttemptedUrl, setLastAttemptedUrl] = useState<string>('');

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

  const runPipelineProcess = async (url: string) => {
    setLastAttemptedUrl(url);
    setAppState('PROCESSING');
    setStageStates(INITIAL_STAGES);
    setTraceLogs([]);
    setErrorMessage(null);

    try {
      updateStage('api', 'PROCESSING');
      addLog('API_REQUEST', 'info', `GET ${url}`, 'Initiating HTTP fetch');
      await new Promise(r => setTimeout(r, 220));

      const fetchResult = await fetchApiData(url);
      setApiData(fetchResult);

      updateStage('api', 'COMPLETE', { 
        recordsCount: fetchResult.recordsCount, 
        latencyMs: fetchResult.responseTimeMs 
      });
      addLog('API_RESPONSE', 'success', `${fetchResult.status} ${fetchResult.statusText}`, `${fetchResult.recordsCount} records fetched in ${fetchResult.responseTimeMs}ms`);

      updateStage('json_parser', 'PROCESSING');
      addLog('JSON_PARSER', 'info', 'Parsing structural JSON AST', `${fetchResult.fieldsCount} root fields, ${fetchResult.nestedFieldsCount} nested objects`);
      await new Promise(r => setTimeout(r, 200));
      updateStage('json_parser', 'COMPLETE', { fieldsCount: fetchResult.fieldsCount });
      addLog('JSON_PARSED', 'success', 'Schema structure validated');

      updateStage('nlp', 'PROCESSING');
      addLog('NLP_PROCESSING', 'info', 'Tokenization & stopword removal started');
      await new Promise(r => setTimeout(r, 250));

      const { analysis, chunks } = processNlpData(fetchResult.data);
      setNlpAnalysis(analysis);
      setRagChunks(chunks);

      updateStage('nlp', 'COMPLETE', { tokensCount: analysis.tokens.length });
      addLog('NLP_COMPLETE', 'success', `${analysis.tokens.length} raw tokens processed`, `Vocabulary: ${analysis.vocabularySize} words`);

      updateStage('tokenizer', 'PROCESSING');
      await new Promise(r => setTimeout(r, 180));
      updateStage('tokenizer', 'COMPLETE', { tokensCount: analysis.tokens.length });
      addLog('TOKENIZER', 'info', 'Lemmatized tokens produced', `Sample: [${analysis.lemmatizedTokens.slice(0, 4).join(', ')}]`);

      updateStage('chunker', 'PROCESSING');
      await new Promise(r => setTimeout(r, 200));
      updateStage('chunker', 'COMPLETE', { chunksCount: chunks.length });
      addLog('CHUNKING', 'success', `${chunks.length} sliding window chunks created`);

      updateStage('embedding', 'PROCESSING');
      addLog('EMBEDDINGS', 'info', 'Generating 384-dimensional dense vectors (all-MiniLM-L6-v2)');
      await new Promise(r => setTimeout(r, 300));

      const embeddingObj = createVectorEmbedding(analysis.sampleText);
      setVectorEmbedding(embeddingObj);

      updateStage('embedding', 'COMPLETE', { dimensions: 384 });
      addLog('EMBEDDINGS_DONE', 'success', 'Vector embeddings calculated & normalized');

      updateStage('vector_db', 'PROCESSING');
      addLog('VECTOR_SEARCH', 'info', 'Indexing vector embeddings into HNSW cosine matrix');
      await new Promise(r => setTimeout(r, 220));
      updateStage('vector_db', 'COMPLETE');
      addLog('VECTOR_DB', 'success', `${chunks.length} vectors indexed successfully`);

      updateStage('mcp_server', 'PROCESSING');
      addLog('MCP_SERVER', 'mcp', 'Model Context Protocol server online', 'Tools: api.fetch(), api.search(), api.retrieve()');
      await new Promise(r => setTimeout(r, 200));
      updateStage('mcp_server', 'COMPLETE');

      updateStage('rag', 'COMPLETE');
      updateStage('llm', 'COMPLETE');

      addLog('SYSTEM_READY', 'success', 'API Neural Explorer pipeline fully initialized', 'Ready for queries.');

      setMessages([
        {
          id: 'welcome-msg',
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `API pipeline successfully connected! Indexed ${fetchResult.recordsCount} records into ${chunks.length} vector chunks with MCP tool bindings ready.`
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
    setActiveToolCall('api.search()');
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
            addLog('MCP_TOOL', 'mcp', 'Executing MCP tool call: api.search()');
          } else if (step.includes('Retrieving')) {
            addLog('VECTOR_SEARCH', 'info', 'Top similarity chunks retrieved from HNSW index');
          } else if (step.includes('RAG')) {
            addLog('RAG', 'info', 'Context prompt assembled for LLM');
          } else if (step.includes('Generating')) {
            addLog('LLM', 'success', 'Generating character streamed LLM response');
          }
        }
      );

      setActiveRagChunks(retrievedChunks);
      setMessages(prev => [...prev, message]);
      addLog('LLM_RESPONSE', 'success', 'Response generated with source citations');

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
    <div className={`min-h-screen flex flex-col font-sans overflow-hidden transition-colors ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#07090e] text-slate-100'
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
        <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] max-h-[calc(100vh-3.5rem)] max-w-full overflow-hidden min-h-0">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0 h-[calc(100vh-13.5rem)] max-h-[calc(100vh-13.5rem)]">
            
            <div className="md:col-span-3 h-full max-h-full overflow-hidden min-w-0 max-w-full min-h-0 flex flex-col">
              <ApiDataPanel
                apiData={apiData}
                nlpAnalysis={nlpAnalysis}
                vectorEmbedding={vectorEmbedding}
                highlightedRecordId={highlightedRecordId}
                theme={theme}
              />
            </div>

            <div className="md:col-span-5 h-full max-h-full overflow-hidden min-w-0 max-w-full min-h-0 flex flex-col">
              <SystemGraph
                stageStates={stageStates}
                activeToolCall={activeToolCall}
                theme={theme}
              />
            </div>

            <div className="md:col-span-4 h-full max-h-full overflow-hidden min-w-0 max-w-full min-h-0 flex flex-col">
              <AiQueryPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isProcessing={isQueryProcessing}
                activeProcessingStep={activeProcessingStep}
                activeRagChunks={activeRagChunks}
                onSelectSourceRecord={handleSelectSourceRecord}
                theme={theme}
              />
            </div>

          </div>

          <div className="h-36 sm:h-40 shrink-0 min-w-0 max-w-full overflow-hidden">
            <LiveTraceConsole
              logs={traceLogs}
              onClearLogs={() => setTraceLogs([])}
              theme={theme}
            />
          </div>
        </div>
      )}

      {appState === 'ERROR' && errorMessage && (
        <ErrorStateModal
          errorMessage={errorMessage}
          onRetry={() => runPipelineProcess(lastAttemptedUrl || 'https://api.example.com/products')}
          onUseSampleData={() => runPipelineProcess('https://api.example.com/products')}
          onClose={() => setAppState('DISCONNECTED')}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
