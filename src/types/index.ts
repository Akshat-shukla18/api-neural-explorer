export type AppState = 'DISCONNECTED' | 'PROCESSING' | 'READY' | 'ERROR';

export type NodeStatus = 'WAITING' | 'PROCESSING' | 'COMPLETE' | 'ERROR';

export type StageId = 
  | 'api'
  | 'json_parser'
  | 'nlp'
  | 'tokenizer'
  | 'chunker'
  | 'embedding'
  | 'vector_db'
  | 'mcp_server'
  | 'rag'
  | 'llm';

export interface PipelineNodeData {
  id: StageId;
  label: string;
  category: 'api' | 'nlp' | 'embedding' | 'vector' | 'mcp' | 'rag' | 'llm';
  status: NodeStatus;
  metrics?: {
    recordsCount?: number;
    fieldsCount?: number;
    tokensCount?: number;
    chunksCount?: number;
    dimensions?: number;
    retrievedChunks?: number;
    latencyMs?: number;
  };
  mcpTools?: {
    name: string;
    description: string;
    active: boolean;
    lastCalled?: string;
  }[];
  activeTool?: string;
}

export interface TraceLog {
  id: string;
  timestamp: string;
  stage: string;
  level: 'info' | 'success' | 'warn' | 'error' | 'mcp';
  message: string;
  details?: string;
}

export interface ApiRecord {
  id: string | number;
  [key: string]: any;
}

export interface ApiFetchResult {
  url: string;
  status: number;
  statusText: string;
  responseTimeMs: number;
  recordsCount: number;
  fieldsCount: number;
  nestedFieldsCount: number;
  nullValuesCount: number;
  dataSizeBytes: number;
  data: ApiRecord[];
  rawJson: string;
}

export interface NlpAnalysis {
  sampleText: string;
  tokens: string[];
  stopwordsRemoved: string[];
  lemmatizedTokens: string[];
  chunksCount: number;
  vocabularySize: number;
}

export interface VectorEmbedding {
  model: string;
  dimensions: number;
  status: 'GENERATED' | 'INDEXED' | 'IDLE';
  sampleVector: number[];
  heatmapValues: number[];
}

export interface RagChunk {
  id: string;
  chunkNumber: number;
  similarity: number;
  recordId: string | number;
  recordTitle: string;
  category?: string;
  price?: number;
  content: string;
  metadata: Record<string, any>;
}

export interface McpToolCall {
  tool: 'api.fetch()' | 'api.search()' | 'api.retrieve()';
  timestamp: string;
  params: Record<string, any>;
  status: 'EXECUTING' | 'SUCCESS' | 'FAILED';
  resultCount?: number;
  latencyMs: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  isStreaming?: boolean;
  steps?: string[];
  mcpToolCall?: McpToolCall;
  ragChunks?: RagChunk[];
  sources?: {
    id: string | number;
    name: string;
    price?: number;
    category?: string;
    snippet: string;
  }[];
}

export interface SampleApiOption {
  id: string;
  name: string;
  description: string;
  url: string;
  sampleData: ApiRecord[];
}
