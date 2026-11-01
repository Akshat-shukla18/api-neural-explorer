import { describe, it, expect, beforeEach } from 'vitest';
import { fetchApiData } from '../src/services/apiService';
import { processRecordsIntoChunks } from '../src/services/jsonProcessingService';
import { getActiveEmbeddingProvider, createVectorEmbedding } from '../src/services/embeddings/embeddingProvider';
import { globalVectorStore } from '../src/services/vectorStore/indexedDbVectorStore';
import { executeMcpTool } from '../src/services/mcpService';
import { planFromNaturalLanguage, executePlan } from '../src/services/operationPlanner';
import { processAiQuery } from '../src/services/ragService';
import type { VectorRecord } from '../src/types';

describe('Phase 12: End-to-End Neural Pipeline Integration', () => {
  const TEST_SOURCE_URL = 'https://jsonplaceholder.typicode.com/posts';

  beforeEach(async () => {
    await globalVectorStore.clear();
  });

  it('executes full pipeline: fetch -> chunk -> embed -> index -> MCP search -> grounded RAG answer', async () => {
    // 1. Data Ingestion
    // Use demo or live fixture data to test full deterministic pipeline
    const fetchResult = await fetchApiData('demo://products', { mode: 'demo' });
    expect(fetchResult.status).toBe(200);
    expect(fetchResult.recordsCount).toBeGreaterThan(0);
    expect(fetchResult.responseTimeMs).toBeGreaterThanOrEqual(0);
    expect(fetchResult.dataSizeBytes).toBeGreaterThan(0);
    expect(fetchResult.fieldPaths?.length).toBeGreaterThan(0);

    // 2. Deterministic Chunking
    const { chunks, totalTokensEstimate } = processRecordsIntoChunks(fetchResult.data, {
      sourceUrl: fetchResult.url
    });
    expect(chunks.length).toBe(fetchResult.recordsCount);
    expect(totalTokensEstimate).toBeGreaterThan(0);
    chunks.forEach(chunk => {
      expect(chunk.contentHash).toBeDefined();
      expect(chunk.contentHash.length).toBeGreaterThan(0);
      expect(chunk.recordId).toBeDefined();
      expect(chunk.fieldPaths.length).toBeGreaterThan(0);
    });

    // 3. Genuine High-Dimensional Embedding
    const provider = getActiveEmbeddingProvider();
    expect(provider.dimensions).toBe(384);
    expect(provider.modelId).toBe('semantic-feature-extractor-384d');

    const chunkTexts = chunks.map(c => c.content);
    const embeddings = await provider.embedDocuments(chunkTexts);
    expect(embeddings.length).toBe(chunks.length);
    embeddings.forEach(emb => {
      expect(emb.length).toBe(384);
      // Verify unit normalization: Euclidean norm should equal ~1.0
      const norm = Math.sqrt(emb.reduce((acc, v) => acc + v * v, 0));
      expect(norm).toBeCloseTo(1.0, 2);
    });

    // 4. Vector Store Indexing with Source Isolation
    const vectorRecords: VectorRecord[] = chunks.map((c, idx) => ({
      id: c.id,
      chunkId: c.id,
      sourceId: fetchResult.url,
      sourceUrl: fetchResult.url,
      recordId: c.recordId,
      content: c.content,
      fieldPaths: c.fieldPaths,
      embedding: embeddings[idx],
      modelId: provider.modelId,
      dimensions: provider.dimensions,
      timestamp: Date.now(),
      contentHash: c.contentHash,
      metadata: { ...c.metadata, title: c.recordTitle, price: c.price, category: c.category }
    }));

    await globalVectorStore.reindexSource(fetchResult.url, vectorRecords);
    const storeStats = globalVectorStore.getStats();
    expect(storeStats.totalVectors).toBe(chunks.length);

    // 5. MCP Tool Execution (api.search)
    const mcpSearchRes = await executeMcpTool('api.search()', {
      query: 'noise canceling wireless headphones',
      limit: 3,
      sourceId: fetchResult.url
    });

    expect(mcpSearchRes.status).toBe('SUCCESS');
    expect(mcpSearchRes.latencyMs).toBeGreaterThanOrEqual(0);
    expect(mcpSearchRes.resultCount).toBeGreaterThan(0);
    expect(mcpSearchRes.data[0].content).toContain('noise canceling');

    // 6. Natural Language Operation Planning
    const plan = planFromNaturalLanguage('Find noise canceling headphones');
    expect(plan.intent).toBe('search');
    const planExecution = await executePlan(plan);
    expect(planExecution.success).toBe(true);
    expect(planExecution.toolCalls.length).toBe(1);

    // 7. Grounded RAG Query and Synthesis
    const querySteps: string[] = [];
    const { message, retrievedChunks } = await processAiQuery(
      'What are the best noise canceling headphones and their price?',
      fetchResult.data,
      chunks,
      (step) => querySteps.push(step)
    );

    expect(retrievedChunks.length).toBeGreaterThan(0);
    expect(message.text.length).toBeGreaterThan(0);
    expect(message.sources?.length).toBeGreaterThan(0);
    // Verified citations point to real record
    const headphoneSource = message.sources?.find(s => String(s.name).toLowerCase().includes('sony') || String(s.snippet).toLowerCase().includes('noise canceling'));
    expect(headphoneSource).toBeDefined();
    expect(message.mcpToolCall?.status).toBe('SUCCESS');
    expect(querySteps.length).toBeGreaterThan(0);
  });
});

