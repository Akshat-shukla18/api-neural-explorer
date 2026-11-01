import type { ApiRecord, RagChunk } from '../types';

export interface ChunkingOptions {
  maxChunkCharacters?: number;
  chunkOverlapCharacters?: number;
  sourceUrl?: string;
  sourceId?: string;
}

const DEFAULT_MAX_CHUNK_CHARS = 450;
const DEFAULT_OVERLAP_CHARS = 50;

/**
 * Computes a fast, deterministic 32-bit FNV-1a hex hash of a string.
 */
export function computeDeterministicHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Extracts a human-meaningful display title from an API record.
 */
export function extractRecordTitle(record: ApiRecord, fallbackIndex: number): string {
  if (record.title && typeof record.title === 'string') return record.title;
  if (record.name && typeof record.name === 'string') return record.name;
  if (record.username && typeof record.username === 'string') return record.username;
  if (record.role && typeof record.role === 'string') {
    return `${record.role}${record.department ? ` - ${record.department}` : ''}`;
  }
  if (record.id !== undefined && record.id !== null) return `Record #${record.id}`;
  return `Record #${fallbackIndex + 1}`;
}

/**
 * Flattens an ApiRecord into a structured, human-readable textual representation
 * while maintaining deep field paths.
 */
export function recordToTextAndPaths(record: ApiRecord, parentPath = ''): { text: string; fieldPaths: string[] } {
  const parts: string[] = [];
  const fieldPaths: string[] = [];

  for (const [key, value] of Object.entries(record)) {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;

    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        // Array of nested objects
        value.forEach((nestedItem, idx) => {
          const sub = recordToTextAndPaths(nestedItem as ApiRecord, `${currentPath}[${idx}]`);
          if (sub.text) parts.push(sub.text);
          fieldPaths.push(...sub.fieldPaths);
        });
      } else {
        // Array of primitives
        parts.push(`${key}: [${value.join(', ')}]`);
        fieldPaths.push(currentPath);
      }
    } else if (typeof value === 'object') {
      const sub = recordToTextAndPaths(value as ApiRecord, currentPath);
      if (sub.text) parts.push(sub.text);
      fieldPaths.push(...sub.fieldPaths);
    } else {
      parts.push(`${key}: ${value}`);
      fieldPaths.push(currentPath);
    }
  }

  return {
    text: parts.join(' | '),
    fieldPaths: Array.from(new Set(fieldPaths))
  };
}

/**
 * Splits records into deterministic, bounded RagChunk items with full source tracking.
 */
export function processRecordsIntoChunks(
  records: ApiRecord[],
  options: ChunkingOptions = {}
): { chunks: RagChunk[]; totalTokensEstimate: number } {
  const maxChars = options.maxChunkCharacters ?? DEFAULT_MAX_CHUNK_CHARS;
  const overlap = options.chunkOverlapCharacters ?? DEFAULT_OVERLAP_CHARS;
  const sourceUrl = options.sourceUrl || 'memory://dataset';
  const sourceId = options.sourceId || computeDeterministicHash(sourceUrl);

  const chunks: RagChunk[] = [];
  let chunkCounter = 1;
  let totalWords = 0;

  records.forEach((record, recordIndex) => {
    const recordId = record.id ?? record._id ?? recordIndex + 1;
    const recordTitle = extractRecordTitle(record, recordIndex);
    const category = typeof record.category === 'string'
      ? record.category
      : typeof record.department === 'string'
        ? record.department
        : typeof record.type === 'string'
          ? record.type
          : undefined;

    const price = typeof record.price === 'number'
      ? record.price
      : typeof record.amount === 'number'
        ? record.amount
        : undefined;

    const { text, fieldPaths } = recordToTextAndPaths(record);
    totalWords += text.split(/\s+/).filter(Boolean).length;

    // If record text is within bounds, generate a single chunk
    if (text.length <= maxChars) {
      const contentHash = computeDeterministicHash(text);
      const chunkId = `chunk-${sourceId}-${recordId}-0`;

      chunks.push({
        id: chunkId,
        chunkNumber: chunkCounter++,
        similarity: 0,
        sourceId,
        sourceUrl,
        recordId,
        recordTitle,
        category,
        price,
        content: text,
        fieldPaths,
        chunkIndex: 0,
        contentHash,
        metadata: { ...record }
      });
    } else {
      // Split large records into overlapping segments
      let startIdx = 0;
      let chunkIdx = 0;

      while (startIdx < text.length) {
        const endIdx = Math.min(startIdx + maxChars, text.length);
        const segment = text.slice(startIdx, endIdx);
        const contentHash = computeDeterministicHash(segment);
        const chunkId = `chunk-${sourceId}-${recordId}-${chunkIdx}`;

        chunks.push({
          id: chunkId,
          chunkNumber: chunkCounter++,
          similarity: 0,
          sourceId,
          sourceUrl,
          recordId,
          recordTitle: `${recordTitle} (Part ${chunkIdx + 1})`,
          category,
          price,
          content: segment,
          fieldPaths,
          chunkIndex: chunkIdx,
          contentHash,
          metadata: { ...record, _chunkIndex: chunkIdx }
        });

        chunkIdx++;
        startIdx += maxChars - overlap;
        if (startIdx >= text.length || endIdx === text.length) break;
      }
    }
  });

  return {
    chunks,
    totalTokensEstimate: Math.round(totalWords * 1.3)
  };
}

