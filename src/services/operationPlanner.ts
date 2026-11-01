import type { ApiOperation, DataSourceMode, McpToolCall } from '../types';
import { executeMcpTool } from './mcpService';

export interface ApiOperationPlan {
  intent: 'fetch' | 'search' | 'filter' | 'retrieve' | 'composite';
  operations: ApiOperation[];
  explanation: string;
  confidence: number;
}

export interface PlanValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PlanExecutionResult {
  plan: ApiOperationPlan;
  toolCalls: McpToolCall[];
  results: any[];
  success: boolean;
}

const FORBIDDEN_FIELDS = new Set(['__proto__', 'constructor', 'prototype', 'eval', 'script']);

/**
 * Validates an ApiOperation against injection and malicious payloads.
 */
export function validateOperation(op: ApiOperation): string[] {
  const errors: string[] = [];

  switch (op.type) {
    case 'fetch': {
      if (!op.sourceUrl || typeof op.sourceUrl !== 'string') {
        errors.push('Fetch operation requires a valid non-empty sourceUrl');
      } else {
        const trimmed = op.sourceUrl.trim();
        if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
          errors.push('Fetch operation rejects non-HTTP/HTTPS protocols');
        }
        if (/169\.254\.169\.254|metadata\.google\.internal/i.test(trimmed)) {
          errors.push('Fetch operation blocks cloud metadata IP addresses');
        }
      }
      break;
    }

    case 'search': {
      if (!op.query || typeof op.query !== 'string' || op.query.trim().length === 0) {
        errors.push('Search operation requires a non-empty query string');
      }
      if (op.limit !== undefined && (typeof op.limit !== 'number' || op.limit < 1 || op.limit > 100)) {
        errors.push('Search limit must be an integer between 1 and 100');
      }
      break;
    }

    case 'filter': {
      if (!op.field || typeof op.field !== 'string') {
        errors.push('Filter operation requires a valid field string');
      } else if (FORBIDDEN_FIELDS.has(op.field.toLowerCase()) || !/^[a-zA-Z0-9_.]+$/.test(op.field)) {
        errors.push(`Filter field '${op.field}' contains disallowed characters or forbidden properties`);
      }

      const validOps = ['eq', 'gt', 'gte', 'lt', 'lte', 'contains'];
      if (!validOps.includes(op.operator)) {
        errors.push(`Filter operator '${op.operator}' is not supported. Use: ${validOps.join(', ')}`);
      }

      if (op.value === undefined || op.value === null) {
        errors.push('Filter operation requires a comparison value');
      }
      break;
    }

    case 'retrieve': {
      if (op.recordId === undefined || op.recordId === null || String(op.recordId).trim() === '') {
        errors.push('Retrieve operation requires a valid recordId');
      }
      break;
    }

    default:
      errors.push(`Unsupported operation type: ${(op as any).type}`);
  }

  return errors;
}

/**
 * Validates an entire operation plan.
 */
export function validatePlan(plan: ApiOperationPlan): PlanValidationResult {
  const errors: string[] = [];

  if (!plan.operations || plan.operations.length === 0) {
    errors.push('Operation plan contains zero executable operations');
  }

  for (let i = 0; i < plan.operations.length; i++) {
    const opErrors = validateOperation(plan.operations[i]);
    opErrors.forEach(err => errors.push(`Operation #${i + 1} (${plan.operations[i].type}): ${err}`));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Parses a natural language user query into a validated ApiOperation AST.
 */
export function planFromNaturalLanguage(
  prompt: string,
  context?: { activeSourceUrl?: string; mode?: DataSourceMode }
): ApiOperationPlan {
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct URL fetch request
  const urlMatch = prompt.match(/(https?:\/\/[^\s]+|demo:\/\/[^\s]+)/i);
  if (urlMatch && (lower.includes('fetch') || lower.includes('load') || lower.includes('ingest') || lower.includes('get from'))) {
    const targetUrl = urlMatch[0];
    const op: ApiOperation = {
      type: 'fetch',
      sourceUrl: targetUrl,
      mode: targetUrl.startsWith('demo://') ? 'demo' : context?.mode || 'live'
    };
    return {
      intent: 'fetch',
      operations: [op],
      explanation: `Fetch and ingest data from endpoint: ${targetUrl}`,
      confidence: 0.95
    };
  }

  // 2. Specific record retrieval by ID
  const retrieveMatch = prompt.match(/\b(?:record|item|post|entry|user|product)\s*(?:#\s*([0-9a-zA-Z_-]+)|id[:\s]+([0-9a-zA-Z_-]+)|([0-9]+)\b)/i);
  if (retrieveMatch && (lower.includes('retrieve') || lower.includes('show') || lower.includes('get') || lower.includes('details for'))) {
    const rawId = retrieveMatch[1] || retrieveMatch[2] || retrieveMatch[3];
    const recordId = isNaN(Number(rawId)) ? rawId : Number(rawId);
    const op: ApiOperation = {
      type: 'retrieve',
      recordId,
      sourceUrl: context?.activeSourceUrl
    };
    return {
      intent: 'retrieve',
      operations: [op],
      explanation: `Retrieve exact record with ID: ${recordId}`,
      confidence: 0.9
    };
  }

  // 3. Numeric comparison filter
  // e.g. "price > 10000", "price >= 500", "cost over 1000", "more than 5000", "rating > 4.5"
  const numericFilterMatch = prompt.match(/([a-zA-Z_]+)\s*(>|>=|<|<=|=|\babove\b|\bover\b|\bgreater than\b|\bbelow\b|\bless than\b)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (numericFilterMatch) {
    let field = numericFilterMatch[1].toLowerCase();
    if (field === 'cost') field = 'price';
    const rawOp = numericFilterMatch[2].toLowerCase();
    const val = Number(numericFilterMatch[3]);

    let operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' = 'eq';
    if (rawOp === '>' || rawOp === 'above' || rawOp === 'over' || rawOp === 'greater than') operator = 'gt';
    else if (rawOp === '>=') operator = 'gte';
    else if (rawOp === '<' || rawOp === 'below' || rawOp === 'less than') operator = 'lt';
    else if (rawOp === '<=') operator = 'lte';

    const filterOp: ApiOperation = {
      type: 'filter',
      field,
      operator,
      value: val,
      sourceUrl: context?.activeSourceUrl
    };

    return {
      intent: 'filter',
      operations: [filterOp],
      explanation: `Filter indexed records where ${field} ${operator} ${val}`,
      confidence: 0.88
    };
  }

  // 4. Exact text or category filter
  // e.g. "category = Shoes", "category is electronics", "brand is Nike"
  const catFilterMatch = prompt.match(/(category|brand|department|status)\s*(?:=|is|equals|in)\s*["']?([a-zA-Z0-9_\s-]+?)["']?(?:\.|$|\s)/i);
  if (catFilterMatch) {
    const field = catFilterMatch[1].toLowerCase();
    const val = catFilterMatch[2].trim();
    const filterOp: ApiOperation = {
      type: 'filter',
      field,
      operator: 'eq',
      value: val,
      sourceUrl: context?.activeSourceUrl
    };
    return {
      intent: 'filter',
      operations: [filterOp],
      explanation: `Filter records matching ${field} = "${val}"`,
      confidence: 0.85
    };
  }

  // 5. Default semantic search
  const searchOp: ApiOperation = {
    type: 'search',
    query: prompt,
    limit: 5,
    sourceUrl: context?.activeSourceUrl
  };

  return {
    intent: 'search',
    operations: [searchOp],
    explanation: `Semantic vector search for query: "${prompt}"`,
    confidence: 0.8
  };
}

/**
 * Executes an operation plan through MCP tools.
 */
export async function executePlan(
  plan: ApiOperationPlan,
  onStep?: (msg: string) => void
): Promise<PlanExecutionResult> {
  const validation = validatePlan(plan);
  if (!validation.isValid) {
    throw new Error(`Plan validation failed: ${validation.errors.join('; ')}`);
  }

  const toolCalls: McpToolCall[] = [];
  const results: any[] = [];
  let success = true;

  for (const op of plan.operations) {
    onStep?.(`Executing plan step: ${op.type.toUpperCase()}`);

    if (op.type === 'fetch') {
      const res = await executeMcpTool('api.fetch()', {
        url: op.sourceUrl,
        mode: op.mode || 'live'
      });
      toolCalls.push(res);
      results.push(res.data);
      if (res.status === 'FAILED') success = false;
    } else if (op.type === 'search') {
      const res = await executeMcpTool('api.search()', {
        query: op.query,
        limit: op.limit || 5,
        sourceId: op.sourceUrl
      });
      toolCalls.push(res);
      results.push(res.data);
      if (res.status === 'FAILED') success = false;
    } else if (op.type === 'filter') {
      const res = await executeMcpTool('api.filter()', {
        field: op.field,
        operator: op.operator,
        value: String(op.value),
        sourceId: op.sourceUrl
      });
      toolCalls.push(res);
      results.push(res.data);
      if (res.status === 'FAILED') success = false;
    } else if (op.type === 'retrieve') {
      const res = await executeMcpTool('api.retrieve()', {
        recordId: op.recordId,
        sourceId: op.sourceUrl
      });
      toolCalls.push(res);
      results.push(res.data);
      if (res.status === 'FAILED') success = false;
    }
  }

  return {
    plan,
    toolCalls,
    results,
    success
  };
}
