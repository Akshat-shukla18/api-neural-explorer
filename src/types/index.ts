export type AppState = 'DISCONNECTED' | 'PROCESSING' | 'READY' | 'ERROR';

export type NodeStatus = 'WAITING' | 'PROCESSING' | 'COMPLETE' | 'ERROR';

export type DataSourceMode = 'live' | 'demo';

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

export interface ApiFetchOptions {
  mode?: DataSourceMode;
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxSizeBytes?: number;
  sampleId?: string;
}

export interface ApiFetchResult {
  url: string;
  mode: DataSourceMode;
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
  fieldPaths?: string[];
  pagination?: {
    page?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface NlpAnalysis {
  sampleText: string;
  tokens: string[];
  stopwordsRemoved: string[];
  lemmatizedTokens: string[];
  chunksCount: number;
  vocabularySize: number;
  totalTokensCount?: number;
}

export interface VectorEmbedding {
  model: string;
  dimensions: number;
  status: 'GENERATED' | 'INDEXED' | 'IDLE';
  sampleVector: number[];
  heatmapValues: number[];
  inferenceTimeMs?: number;
}

export interface RagChunk {
  id: string;
  chunkNumber: number;
  similarity: number;
  sourceId: string;
  sourceUrl: string;
  recordId: string | number;
  recordTitle: string;
  category?: string;
  price?: number;
  content: string;
  fieldPaths: string[];
  chunkIndex: number;
  contentHash: string;
  metadata: Record<string, any>;
}

export interface VectorRecord {
  id: string;
  chunkId: string;
  sourceId: string;
  sourceUrl: string;
  recordId: string | number;
  content: string;
  fieldPaths: string[];
  embedding: number[];
  modelId: string;
  dimensions: number;
  timestamp: number;
  contentHash: string;
  metadata: Record<string, any>;
}

export interface EmbeddingProvider {
  readonly providerId: string;
  readonly modelId: string;
  readonly dimensions: number;
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

export interface EmbeddingConfig {
  provider: 'local-minilm' | 'semantic-feature' | 'remote-openai' | 'remote-gemini' | 'remote-ollama';
  modelId: string;
  dimensions: number;
  apiKey?: string;
  endpoint?: string;
}

export interface LlmConfig {
  provider: 'retrieval-only' | 'gemini' | 'openai' | 'ollama';
  modelId: string;
  apiKey?: string;
  endpoint?: string;
  temperature?: number;
}

export interface McpToolCall {
  tool: 'api.fetch()' | 'api.search()' | 'api.retrieve()' | 'api.filter()';
  timestamp: string;
  params: Record<string, any>;
  status: 'EXECUTING' | 'SUCCESS' | 'FAILED';
  resultCount?: number;
  latencyMs: number;
  error?: string;
  data?: any;
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
    fieldPaths?: string[];
  }[];
}

export interface SampleApiOption {
  id: string;
  name: string;
  description: string;
  url: string;
  sampleData: ApiRecord[];
}

export type ApiOperation =
  | {
      type: 'fetch';
      sourceUrl: string;
      mode?: DataSourceMode;
    }
  | {
      type: 'search';
      query: string;
      limit?: number;
      sourceUrl?: string;
    }
  | {
      type: 'filter';
      field: string;
      operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
      value: string | number | boolean;
      sourceUrl?: string;
    }
  | {
      type: 'retrieve';
      recordId: string | number;
      sourceUrl?: string;
    };
