import { describe, it, expect, beforeEach } from 'vitest';
import {
  planFromNaturalLanguage,
  validateOperation,
  validatePlan,
  executePlan
} from '../src/services/operationPlanner';
import { globalVectorStore } from '../src/services/vectorStore/indexedDbVectorStore';
import { getActiveEmbeddingProvider } from '../src/services/embeddings/embeddingProvider';

describe('Phase 9: Natural-Language Operation Planner', () => {
  beforeEach(async () => {
    await globalVectorStore.clear();
  });

  it('parses fetch intent from a natural language instruction with URL', () => {
    const plan = planFromNaturalLanguage('Please fetch https://jsonplaceholder.typicode.com/posts and analyze it');
    expect(plan.intent).toBe('fetch');
    expect(plan.operations.length).toBe(1);
    expect(plan.operations[0].type).toBe('fetch');
    if (plan.operations[0].type === 'fetch') {
      expect(plan.operations[0].sourceUrl).toBe('https://jsonplaceholder.typicode.com/posts');
    }
  });

  it('parses retrieve intent for a specific record ID', () => {
    const plan = planFromNaturalLanguage('Show details for record #105');
    expect(plan.intent).toBe('retrieve');
    expect(plan.operations.length).toBe(1);
    if (plan.operations[0].type === 'retrieve') {
      expect(plan.operations[0].recordId).toBe(105);
    }
  });

  it('parses numeric comparison filter intent', () => {
    const plan = planFromNaturalLanguage('Show all items with price > 10000');
    expect(plan.intent).toBe('filter');
    expect(plan.operations.length).toBe(1);
    if (plan.operations[0].type === 'filter') {
      expect(plan.operations[0].field).toBe('price');
      expect(plan.operations[0].operator).toBe('gt');
      expect(plan.operations[0].value).toBe(10000);
    }
  });

  it('parses category equality filter intent', () => {
    const plan = planFromNaturalLanguage('Filter items where category is Footwear');
    expect(plan.intent).toBe('filter');
    expect(plan.operations.length).toBe(1);
    if (plan.operations[0].type === 'filter') {
      expect(plan.operations[0].field).toBe('category');
      expect(plan.operations[0].operator).toBe('eq');
      expect(plan.operations[0].value).toBe('Footwear');
    }
  });

  it('defaults to semantic search for generic natural-language queries', () => {
    const plan = planFromNaturalLanguage('What are the best noise-canceling headphones for travel?');
    expect(plan.intent).toBe('search');
    expect(plan.operations[0].type).toBe('search');
    if (plan.operations[0].type === 'search') {
      expect(plan.operations[0].query).toBe('What are the best noise-canceling headphones for travel?');
      expect(plan.operations[0].limit).toBe(5);
    }
  });

  it('rejects forbidden prototype manipulation and invalid field characters', () => {
    const errorsProto = validateOperation({
      type: 'filter',
      field: '__proto__',
      operator: 'eq',
      value: 'polluted'
    });
    expect(errorsProto.some(e => e.includes('forbidden'))).toBe(true);

    const errorsChar = validateOperation({
      type: 'filter',
      field: 'price; DROP TABLE;',
      operator: 'gt',
      value: 10
    });
    expect(errorsChar.some(e => e.includes('disallowed characters'))).toBe(true);
  });

  it('rejects cloud metadata SSRF attempts in fetch operations', () => {
    const errors = validateOperation({
      type: 'fetch',
      sourceUrl: 'http://169.254.169.254/latest/meta-data/'
    });
    expect(errors.some(e => e.includes('blocks cloud metadata'))).toBe(true);
  });

  it('executes the generated plan through real MCP tools', async () => {
    const provider = getActiveEmbeddingProvider();
    const vec = await provider.embedQuery('ergonomic mouse');
    await globalVectorStore.insertBatch([
      {
        id: 'mouse-1',
        chunkId: 'chunk-m1',
        sourceId: 'demo-src',
        sourceUrl: 'demo-src',
        recordId: 55,
        content: 'Ergonomic wireless mouse with custom thumb wheel and bluetooth connectivity',
        fieldPaths: ['title', 'category', 'price'],
        embedding: vec,
        modelId: provider.modelId,
        dimensions: provider.dimensions,
        timestamp: Date.now(),
        contentHash: 'hash-m1',
        metadata: { title: 'Ergonomic Mouse', category: 'Accessories', price: 7500 }
      }
    ]);

    const plan = planFromNaturalLanguage('Find ergonomic wireless mouse');
    const result = await executePlan(plan);

    expect(result.success).toBe(true);
    expect(result.toolCalls.length).toBe(1);
    expect(result.toolCalls[0].tool).toBe('api.search()');
    expect(result.toolCalls[0].status).toBe('SUCCESS');
    expect(result.results[0].length).toBeGreaterThan(0);
    expect(result.results[0][0].recordId).toBe(55);
  });
});

