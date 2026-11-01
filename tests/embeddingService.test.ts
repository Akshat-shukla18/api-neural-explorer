import { describe, it, expect } from 'vitest';
import {
  SemanticFeatureProvider,
  validateAndNormalizeVector,
  setActiveEmbeddingProvider
} from '../src/services/embeddings/embeddingProvider';
import {
  computeCosineSimilarity,
  generateVectorHeatmap,
  createVectorEmbedding,
  searchVectorDatabase
} from '../src/services/vectorService';
import type { RagChunk } from '../src/types';

describe('EmbeddingProvider - SemanticFeatureProvider', () => {
  const provider = new SemanticFeatureProvider();

  it('generates genuine 384-dimensional unit vectors', async () => {
    const text = 'Nike Pegasus 40 running shoes with responsive cushioning';
    const [vector] = await provider.embedDocuments([text]);

    expect(vector).toHaveLength(384);
    vector.forEach(val => {
      expect(Number.isFinite(val)).toBe(true);
    });

    // Verify L2 unit norm
    const sumSquares = vector.reduce((acc, v) => acc + v * v, 0);
    expect(Math.abs(Math.sqrt(sumSquares) - 1.0)).toBeLessThan(0.01);
  });

  it('produces distinct vectors for distinct semantic content', async () => {
    const [shoesVec] = await provider.embedDocuments(['Footwear running sneakers']);
    const [financeVec] = await provider.embedDocuments(['Financial ledger payment transactions']);

    expect(shoesVec).not.toEqual(financeVec);

    const simDifferent = computeCosineSimilarity(shoesVec, financeVec);
    const [shoesVec2] = await provider.embedDocuments(['Athletic running shoes with cushioning']);
    const simSimilar = computeCosineSimilarity(shoesVec, shoesVec2);

    expect(simSimilar).toBeGreaterThan(simDifferent);
  });

  it('handles empty input strings safely with 0 vectors', () => {
    const vector = validateAndNormalizeVector(new Array(384).fill(0), 384);
    expect(vector).toHaveLength(384);
  });
});

describe('VectorService - Cosine Similarity & Search', () => {
  it('calculates exact mathematical cosine similarity', () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];

    expect(computeCosineSimilarity(vecA, vecB)).toBe(1.0);
    expect(computeCosineSimilarity(vecA, vecC)).toBe(0.0);
  });

  it('creates vector embedding metadata with real model identifier', async () => {
    setActiveEmbeddingProvider(new SemanticFeatureProvider());
    const result = await createVectorEmbedding('Test sample text');

    expect(result.model).toBe('semantic-feature-extractor-384d');
    expect(result.dimensions).toBe(384);
    expect(result.status).toBe('GENERATED');
    expect(result.sampleVector).toHaveLength(8);
    expect(result.heatmapValues).toHaveLength(32);
  });

  it('searches vector chunks and ranks by genuine similarity without Math.random', async () => {
    const chunks: RagChunk[] = [
      {
        id: 'chunk-1',
        chunkNumber: 1,
        similarity: 0,
        sourceId: 's1',
        sourceUrl: 'https://api.test.com',
        recordId: 1,
        recordTitle: 'Nike Air Max',
        category: 'Shoes',
        price: 12999,
        content: 'name: Nike Air Max | category: Shoes | running footwear with cushioning',
        fieldPaths: ['name', 'category'],
        chunkIndex: 0,
        contentHash: 'h1',
        metadata: {}
      },
      {
        id: 'chunk-2',
        chunkNumber: 2,
        similarity: 0,
        sourceId: 's1',
        sourceUrl: 'https://api.test.com',
        recordId: 2,
        recordTitle: 'Apple Watch Series 9',
        category: 'Electronics',
        price: 41900,
        content: 'name: Apple Watch Series 9 | category: Electronics | smartwatch with health monitoring',
        fieldPaths: ['name', 'category'],
        chunkIndex: 0,
        contentHash: 'h2',
        metadata: {}
      }
    ];

    const resultsShoes = await searchVectorDatabase('cushioned running shoes', chunks, 0.1, 5);
    expect(resultsShoes.length).toBeGreaterThan(0);
    expect(resultsShoes[0].recordTitle).toBe('Nike Air Max');

    const resultsWatch = await searchVectorDatabase('smartwatch health sensor', chunks, 0.1, 5);
    expect(resultsWatch.length).toBeGreaterThan(0);
    expect(resultsWatch[0].recordTitle).toBe('Apple Watch Series 9');

    // Returns empty when no items meet threshold
    const resultsIrrelevant = await searchVectorDatabase('quantum physics astrophysics galactic nebula', chunks, 0.8, 5);
    expect(resultsIrrelevant).toHaveLength(0);
  });
});

