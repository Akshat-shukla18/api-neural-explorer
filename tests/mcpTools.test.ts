import { describe, it, expect, beforeEach } from 'vitest';
import { executeMcpTool, MCP_TOOL_REGISTRY } from '../src/services/mcpService';
import { globalVectorStore } from '../src/services/vectorStore/indexedDbVectorStore';
import { getActiveEmbeddingProvider } from '../src/services/embeddings/embeddingProvider';

describe('Phase 8: Real MCP Tool Service', () => {
  beforeEach(async () => {
    await globalVectorStore.clear();
  });

  it('exposes the 4 required tools in the MCP registry with defined schemas', () => {
    expect(MCP_TOOL_REGISTRY['api.fetch()']).toBeDefined();
    expect(MCP_TOOL_REGISTRY['api.search()']).toBeDefined();
    expect(MCP_TOOL_REGISTRY['api.retrieve()']).toBeDefined();
    expect(MCP_TOOL_REGISTRY['api.filter()']).toBeDefined();

    expect(MCP_TOOL_REGISTRY['api.fetch()'].parameters.url.required).toBe(true);
    expect(MCP_TOOL_REGISTRY['api.search()'].parameters.query.required).toBe(true);
    expect(MCP_TOOL_REGISTRY['api.retrieve()'].parameters.recordId.required).toBe(true);
    expect(MCP_TOOL_REGISTRY['api.filter()'].parameters.field.required).toBe(true);
  });

  it('fails with clear error when required parameter is missing', async () => {
    const result = await executeMcpTool('api.fetch()', {});
    expect(result.status).toBe('FAILED');
    expect(result.error).toContain("Missing required parameter 'url'");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('fails with clear error when parameter has invalid type', async () => {
    const result = await executeMcpTool('api.search()', { query: 12345 as any });
    expect(result.status).toBe('FAILED');
    expect(result.error).toContain("must be a string");
  });

  it('returns FAILED for unknown tool calls', async () => {
    const result = await executeMcpTool('unknown.tool()' as any, {});
    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('Unknown MCP tool');
  });

  it('executes api.fetch() in demo mode and returns normalized records with genuine latency', async () => {
    const result = await executeMcpTool('api.fetch()', { url: 'demo://products', mode: 'demo' });
    expect(result.status).toBe('SUCCESS');
    expect(result.resultCount).toBeGreaterThan(0);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.data).toBeDefined();
    expect(result.data.recordsCount).toBe(result.resultCount);
  });

  it('executes api.search(), api.retrieve(), and api.filter() against real vector store data', async () => {
    const provider = getActiveEmbeddingProvider();
    const vec1 = await provider.embedQuery('high performance gaming laptop');
    const vec2 = await provider.embedQuery('leather running sneakers');

    await globalVectorStore.insertBatch([
      {
        id: 'rec-1',
        chunkId: 'chunk-1',
        sourceId: 'src-1',
        sourceUrl: 'https://example.com/api',
        recordId: 101,
        content: 'High performance gaming laptop with 32GB RAM and RTX 4080',
        fieldPaths: ['title', 'price'],
        embedding: vec1,
        modelId: provider.modelId,
        dimensions: provider.dimensions,
        timestamp: Date.now(),
        contentHash: 'hash-1',
        metadata: { title: 'Gaming Laptop', price: 150000, category: 'Computers' }
      },
      {
        id: 'rec-2',
        chunkId: 'chunk-2',
        sourceId: 'src-1',
        sourceUrl: 'https://example.com/api',
        recordId: 102,
        content: 'Lightweight leather running sneakers for marathon athletes',
        fieldPaths: ['title', 'price'],
        embedding: vec2,
        modelId: provider.modelId,
        dimensions: provider.dimensions,
        timestamp: Date.now(),
        contentHash: 'hash-2',
        metadata: { title: 'Running Shoes', price: 4500, category: 'Footwear' }
      }
    ]);

    // Test api.search()
    const searchRes = await executeMcpTool('api.search()', {
      query: 'fast portable computer',
      limit: 2
    });
    expect(searchRes.status).toBe('SUCCESS');
    expect(searchRes.resultCount).toBe(2);
    expect(searchRes.data[0].recordId).toBe(101);
    expect(searchRes.data[0].similarity).toBeGreaterThan(0);

    // Test api.retrieve()
    const retrieveRes = await executeMcpTool('api.retrieve()', {
      recordId: 102,
      sourceId: 'src-1'
    });
    expect(retrieveRes.status).toBe('SUCCESS');
    expect(retrieveRes.resultCount).toBe(1);
    expect(retrieveRes.data[0].recordId).toBe(102);

    // Test api.filter()
    const filterRes = await executeMcpTool('api.filter()', {
      field: 'price',
      operator: 'gt',
      value: '10000',
      sourceId: 'src-1'
    });
    expect(filterRes.status).toBe('SUCCESS');
    expect(filterRes.resultCount).toBe(1);
    expect(filterRes.data[0].recordId).toBe(101);
  });
});

