import { describe, it, expect, beforeEach } from 'vitest';
import { PersistentVectorStore } from '../src/services/vectorStore/indexedDbVectorStore';
import type { VectorRecord } from '../src/types';

describe('PersistentVectorStore - Source Isolation & Indexing', () => {
  let store: PersistentVectorStore;

  const mockPostRecord: VectorRecord = {
    id: 'chunk-posts-1-0',
    chunkId: 'chunk-posts-1-0',
    sourceId: 'posts',
    sourceUrl: 'https://jsonplaceholder.typicode.com/posts',
    recordId: 1,
    content: 'title: Introduction to AI | body: Deep neural networks overview',
    fieldPaths: ['title', 'body'],
    embedding: [1, 0, 0, 0],
    modelId: 'test-model',
    dimensions: 4,
    timestamp: Date.now(),
    contentHash: 'hash-post-1',
    metadata: { userId: 1 }
  };

  const mockUserRecord: VectorRecord = {
    id: 'chunk-users-101-0',
    chunkId: 'chunk-users-101-0',
    sourceId: 'users',
    sourceUrl: 'https://jsonplaceholder.typicode.com/users',
    recordId: 101,
    content: 'name: Alex Rivera | role: Senior AI Engineer',
    fieldPaths: ['name', 'role'],
    embedding: [1, 0, 0, 0], // identical embedding to test source isolation
    modelId: 'test-model',
    dimensions: 4,
    timestamp: Date.now(),
    contentHash: 'hash-user-1',
    metadata: { department: 'Infrastructure' }
  };

  beforeEach(() => {
    store = new PersistentVectorStore();
    store.clearAll();
  });

  it('inserts and retrieves records by ID', async () => {
    await store.insert(mockPostRecord);
    const retrieved = await store.getById(mockPostRecord.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.recordId).toBe(1);
    expect(retrieved?.content).toContain('Introduction to AI');
    expect(retrieved?.fieldPaths).toEqual(['title', 'body']);
  });

  it('strictly isolates sources during search to prevent cross-source leakage', async () => {
    await store.batchInsert([mockPostRecord, mockUserRecord]);

    // Query for Posts API specifically
    const postResults = await store.search([1, 0, 0, 0], {
      sourceUrl: 'https://jsonplaceholder.typicode.com/posts'
    });

    expect(postResults).toHaveLength(1);
    expect(postResults[0].record.sourceUrl).toBe('https://jsonplaceholder.typicode.com/posts');
    expect(postResults[0].record.recordId).toBe(1);

    // Query for Users API specifically
    const userResults = await store.search([1, 0, 0, 0], {
      sourceUrl: 'https://jsonplaceholder.typicode.com/users'
    });

    expect(userResults).toHaveLength(1);
    expect(userResults[0].record.sourceUrl).toBe('https://jsonplaceholder.typicode.com/users');
    expect(userResults[0].record.recordId).toBe(101);
  });

  it('re-indexes a source cleanly without creating duplicates', async () => {
    await store.insert(mockPostRecord);

    const updatedPost: VectorRecord = {
      ...mockPostRecord,
      content: 'title: Introduction to AI (Updated)',
      contentHash: 'hash-post-1-v2'
    };

    await store.reindexSource(mockPostRecord.sourceUrl, [updatedPost]);

    const stats = store.getStats();
    expect(stats.totalVectors).toBe(1);

    const retrieved = await store.getById(mockPostRecord.id);
    expect(retrieved?.content).toBe('title: Introduction to AI (Updated)');
  });

  it('deletes all vectors belonging to a source when cleared', async () => {
    await store.batchInsert([mockPostRecord, mockUserRecord]);

    const deleted = await store.deleteBySource('https://jsonplaceholder.typicode.com/posts');
    expect(deleted).toBe(1);

    const stats = store.getStats();
    expect(stats.totalVectors).toBe(1);
    expect(stats.sources[0].sourceUrl).toBe('https://jsonplaceholder.typicode.com/users');
  });
});

