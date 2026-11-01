import { describe, it, expect } from 'vitest';
import {
  processRecordsIntoChunks,
  recordToTextAndPaths,
  computeDeterministicHash,
  extractRecordTitle
} from '../src/services/jsonProcessingService';
import type { ApiRecord } from '../src/types';

describe('JsonProcessingService - Deterministic Hashing & Titles', () => {
  it('generates identical hashes for identical strings', () => {
    const text = 'Nike Air Max 270 | category: Shoes | price: 12999';
    const hash1 = computeDeterministicHash(text);
    const hash2 = computeDeterministicHash(text);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(8);
  });

  it('generates distinct hashes for different strings', () => {
    const hash1 = computeDeterministicHash('Content Alpha');
    const hash2 = computeDeterministicHash('Content Beta');
    expect(hash1).not.toBe(hash2);
  });

  it('extracts titles from title, name, role, or fallback id', () => {
    expect(extractRecordTitle({ id: 1, title: 'My Post' }, 0)).toBe('My Post');
    expect(extractRecordTitle({ id: 2, name: 'Alice' }, 0)).toBe('Alice');
    expect(extractRecordTitle({ id: 3, role: 'Lead Architect', department: 'Core' }, 0)).toBe('Lead Architect - Core');
    expect(extractRecordTitle({ id: 99 }, 0)).toBe('Record #99');
  });
});

describe('JsonProcessingService - Field Path Extraction', () => {
  it('extracts flattened text and nested field paths', () => {
    const record: ApiRecord = {
      id: 12,
      userId: 3,
      title: 'Example title',
      body: 'Example body content',
      author: {
        name: 'John Doe',
        contact: {
          email: 'john@example.com'
        }
      }
    };

    const { text, fieldPaths } = recordToTextAndPaths(record);
    expect(text).toContain('title: Example title');
    expect(text).toContain('name: John Doe');
    expect(fieldPaths).toContain('title');
    expect(fieldPaths).toContain('body');
    expect(fieldPaths).toContain('author.name');
    expect(fieldPaths).toContain('author.contact.email');
  });
});

describe('JsonProcessingService - Chunking Behavior', () => {
  it('creates deterministic chunk IDs and hashes without data loss', () => {
    const records: ApiRecord[] = [
      { id: 101, title: 'First Post', body: 'Short text' },
      { id: 102, title: 'Second Post', body: 'Another short text' }
    ];

    const run1 = processRecordsIntoChunks(records, { sourceUrl: 'https://api.test.com/data' });
    const run2 = processRecordsIntoChunks(records, { sourceUrl: 'https://api.test.com/data' });

    expect(run1.chunks).toHaveLength(2);
    expect(run1.chunks[0].id).toBe(run2.chunks[0].id);
    expect(run1.chunks[0].contentHash).toBe(run2.chunks[0].contentHash);
    expect(run1.chunks[0].recordId).toBe(101);
    expect(run1.chunks[0].sourceUrl).toBe('https://api.test.com/data');
  });

  it('splits oversized records into overlapping chunks preserving source identity', () => {
    const longBody = 'A'.repeat(800);
    const records: ApiRecord[] = [
      { id: 50, title: 'Long Article', content: longBody }
    ];

    const result = processRecordsIntoChunks(records, {
      maxChunkCharacters: 300,
      chunkOverlapCharacters: 50,
      sourceUrl: 'https://api.test.com/articles'
    });

    expect(result.chunks.length).toBeGreaterThan(1);
    result.chunks.forEach(chunk => {
      expect(chunk.recordId).toBe(50);
      expect(chunk.sourceUrl).toBe('https://api.test.com/articles');
      expect(chunk.content.length).toBeLessThanOrEqual(300);
    });
  });
});

