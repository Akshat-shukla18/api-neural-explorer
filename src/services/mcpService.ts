import type { McpToolCall, ApiRecord, RagChunk, VectorRecord } from '../types';
import { fetchApiData } from './apiService';
import { globalVectorStore } from './vectorStore/indexedDbVectorStore';
import { getActiveEmbeddingProvider } from './embeddings/embeddingProvider';

export interface McpToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'string_or_number';
  description: string;
  required?: boolean;
  enum?: string[];
  default?: unknown;
}

export interface McpToolDefinition {
  name: 'api.fetch()' | 'api.search()' | 'api.retrieve()' | 'api.filter()';
  description: string;
  parameters: Record<string, McpToolParameterSchema>;
  execute: (params: Record<string, any>) => Promise<{ data: any; resultCount: number }>;
}

export interface McpExecutionResult<T = any> {
  call: McpToolCall;
  data?: T;
  error?: string;
}

/**
 * Validates parameters against a declared tool schema.
 */
function validateParams(
  toolName: string,
  params: Record<string, any>,
  schema: Record<string, McpToolParameterSchema>
): void {
  for (const [key, prop] of Object.entries(schema)) {
    if (prop.required && (params[key] === undefined || params[key] === null || params[key] === '')) {
      throw new Error(`Tool ${toolName}: Missing required parameter '${key}' (${prop.description})`);
    }

    if (params[key] !== undefined && params[key] !== null) {
      const val = params[key];
      if (prop.type === 'string' && typeof val !== 'string') {
        throw new Error(`Tool ${toolName}: Parameter '${key}' must be a string, got ${typeof val}`);
      }
      if (prop.type === 'string_or_number' && typeof val !== 'string' && typeof val !== 'number') {
        throw new Error(`Tool ${toolName}: Parameter '${key}' must be a string or number, got ${typeof val}`);
      }
      if (prop.type === 'number' && (typeof val !== 'number' || isNaN(val))) {
        throw new Error(`Tool ${toolName}: Parameter '${key}' must be a valid number, got ${typeof val}`);
      }
      if (prop.type === 'boolean' && typeof val !== 'boolean') {
        throw new Error(`Tool ${toolName}: Parameter '${key}' must be a boolean, got ${typeof val}`);
      }
      if (prop.type === 'object' && (typeof val !== 'object' || Array.isArray(val))) {
        throw new Error(`Tool ${toolName}: Parameter '${key}' must be an object, got ${typeof val}`);
      }
      if (prop.enum && !prop.enum.includes(val)) {
        throw new Error(`Tool ${toolName}: Parameter '${key}' must be one of [${prop.enum.join(', ')}], got '${val}'`);
      }
    }
  }
}

/**
 * Built-in MCP Tool Registry
 */
export const MCP_TOOL_REGISTRY: Record<string, McpToolDefinition> = {
  'api.fetch()': {
    name: 'api.fetch()',
    description: 'Fetch and normalize JSON records from an HTTP REST API or demo dataset.',
    parameters: {
      url: { type: 'string', description: 'Target API endpoint URL or sample dataset identifier', required: true },
      mode: { type: 'string', description: 'Data source mode (live or demo)', enum: ['live', 'demo'], default: 'live' },
      headers: { type: 'object', description: 'Optional request headers' },
      params: { type: 'object', description: 'Optional query parameters' }
    },
    execute: async (params) => {
      const result = await fetchApiData(params.url, {
        mode: params.mode || 'live',
        headers: params.headers,
        queryParams: params.params
      });
      return {
        data: result,
        resultCount: result.recordsCount
      };
    }
  },

  'api.search()': {
    name: 'api.search()',
    description: 'Search indexed vector embeddings using a natural-language query and cosine similarity.',
    parameters: {
      query: { type: 'string', description: 'Natural-language search query', required: true },
      limit: { type: 'number', description: 'Maximum number of results to return (default 4)', default: 4 },
      threshold: { type: 'number', description: 'Minimum cosine similarity threshold (default 0.0)', default: 0.0 },
      sourceId: { type: 'string', description: 'Optional sourceId to filter vectors' }
    },
    execute: async (params) => {
      const limit = Math.max(1, Math.min(params.limit || 4, 50));
      const threshold = params.threshold !== undefined ? Number(params.threshold) : 0.0;
      const embeddingProvider = getActiveEmbeddingProvider();
      
      const queryVector = await embeddingProvider.embedQuery(params.query);
      const matches = await globalVectorStore.search(queryVector, {
        limit,
        threshold,
        sourceId: params.sourceId
      });

      const chunks: RagChunk[] = matches.map((m, idx) => ({
        id: m.record.chunkId || m.record.id,
        chunkNumber: idx + 1,
        similarity: Math.round(m.similarity * 1000) / 1000,
        sourceId: m.record.sourceId,
        sourceUrl: m.record.sourceUrl,
        recordId: m.record.recordId,
        recordTitle: m.record.metadata?.title || `Record #${m.record.recordId}`,
        category: m.record.metadata?.category,
        price: m.record.metadata?.price,
        content: m.record.content,
        fieldPaths: m.record.fieldPaths,
        chunkIndex: idx,
        contentHash: m.record.contentHash,
        metadata: m.record.metadata
      }));

      return {
        data: chunks,
        resultCount: chunks.length
      };
    }
  },

  'api.retrieve()': {
    name: 'api.retrieve()',
    description: 'Retrieve a specific record and its associated vector chunks by record ID.',
    parameters: {
      recordId: { type: 'string_or_number', description: 'Unique record ID to retrieve', required: true },
      sourceId: { type: 'string', description: 'Optional source ID namespace' }
    },
    execute: async (params) => {
      const records = await globalVectorStore.getByRecordId(params.recordId, params.sourceId);
      return {
        data: records,
        resultCount: records.length
      };
    }
  },

  'api.filter()': {
    name: 'api.filter()',
    description: 'Filter indexed records by metadata field, operator, and comparison value.',
    parameters: {
      field: { type: 'string', description: 'Metadata field path to evaluate', required: true },
      operator: { type: 'string', description: 'Comparison operator', enum: ['eq', 'gt', 'gte', 'lt', 'lte', 'contains'], required: true },
      value: { type: 'string', description: 'Value to compare against', required: true },
      sourceId: { type: 'string', description: 'Optional source ID' }
    },
    execute: async (params) => {
      const all = await globalVectorStore.getAll(params.sourceId);
      const targetVal = params.value;
      const numTarget = Number(targetVal);
      const isNum = !isNaN(numTarget);

      const filtered = all.filter((rec: VectorRecord) => {
        const val = rec.metadata?.[params.field];
        if (val === undefined || val === null) return false;

        switch (params.operator) {
          case 'eq':
            return String(val).toLowerCase() === String(targetVal).toLowerCase();
          case 'contains':
            return String(val).toLowerCase().includes(String(targetVal).toLowerCase());
          case 'gt':
            return isNum && Number(val) > numTarget;
          case 'gte':
            return isNum && Number(val) >= numTarget;
          case 'lt':
            return isNum && Number(val) < numTarget;
          case 'lte':
            return isNum && Number(val) <= numTarget;
          default:
            return false;
        }
      });

      return {
        data: filtered,
        resultCount: filtered.length
      };
    }
  }
};

/**
 * Execute an MCP Tool using real operations, validated schemas, and genuine performance timing.
 * Never fabricates latency or status.
 */
export async function executeMcpTool(
  toolName: 'api.fetch()' | 'api.search()' | 'api.retrieve()' | 'api.filter()',
  params: Record<string, any>
): Promise<McpToolCall> {
  const tool = MCP_TOOL_REGISTRY[toolName];
  const startTime = performance.now();
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);

  if (!tool) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      tool: toolName,
      timestamp,
      params,
      status: 'FAILED',
      latencyMs: elapsed,
      error: `Unknown MCP tool '${toolName}'. Registered tools: ${Object.keys(MCP_TOOL_REGISTRY).join(', ')}`
    };
  }

  try {
    validateParams(toolName, params, tool.parameters);
    const outcome = await tool.execute(params);
    const elapsed = Math.round(performance.now() - startTime);

    return {
      tool: toolName,
      timestamp,
      params,
      status: 'SUCCESS',
      resultCount: outcome.resultCount,
      latencyMs: Math.max(1, elapsed),
      data: outcome.data
    };
  } catch (err) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      tool: toolName,
      timestamp,
      params,
      status: 'FAILED',
      resultCount: 0,
      latencyMs: Math.max(1, elapsed),
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
