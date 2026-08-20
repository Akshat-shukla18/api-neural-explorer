import type { ApiRecord, NlpAnalysis, RagChunk } from '../types';

const COMMON_STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'this', 'but', 'they', 'have'
]);

const LEMMA_MAP: Record<string, string> = {
  'running': 'run',
  'shoes': 'shoe',
  'designed': 'design',
  'comfort': 'comfort',
  'cushioning': 'cushion',
  'headphones': 'headphone',
  'processors': 'processor',
  'monitoring': 'monitor',
  'features': 'feature',
  'switches': 'switch',
  'transactions': 'transaction',
  'payments': 'payment',
  'users': 'user',
  'queries': 'query',
  'electronics': 'electronic',
  'products': 'product'
};

export function lemmatizeWord(word: string): string {
  const lower = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (LEMMA_MAP[lower]) return LEMMA_MAP[lower];
  if (lower.endsWith('ing') && lower.length > 5) return lower.slice(0, -3);
  if (lower.endsWith('ed') && lower.length > 4) return lower.slice(0, -2);
  if (lower.endsWith('es') && lower.length > 4) return lower.slice(0, -2);
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 3) return lower.slice(0, -1);
  return lower;
}

export function processNlpData(records: ApiRecord[]): { analysis: NlpAnalysis; chunks: RagChunk[] } {
  let sampleText = "Running shoes designed for everyday comfort";
  if (records.length > 0) {
    const r = records[0];
    sampleText = r.description || r.name || `${r.role || r.type || 'Item'} ${r.category || r.department || ''}`;
  }

  const rawTokens = sampleText.split(/\s+/).map(t => t.replace(/[^a-zA-Z0-9]/g, '')).filter(Boolean);
  const stopwordsRemoved = rawTokens.filter(t => !COMMON_STOPWORDS.has(t.toLowerCase()));
  const lemmatizedTokens = stopwordsRemoved.map(lemmatizeWord);

  const chunks: RagChunk[] = [];
  let chunkCounter = 1;

  records.forEach((rec, idx) => {
    const title = rec.name || rec.title || rec.role || rec.id || `Record #${idx + 1}`;
    const category = rec.category || rec.department || rec.type || 'General';
    const price = rec.price || rec.amount;

    const textRepresentation = Object.entries(rec)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' | ');

    chunks.push({
      id: `chunk-${chunkCounter}`,
      chunkNumber: chunkCounter,
      similarity: 0,
      recordId: rec.id,
      recordTitle: title,
      category,
      price,
      content: textRepresentation,
      metadata: { ...rec }
    });

    chunkCounter++;
  });

  const vocabularySet = new Set<string>();
  records.forEach(rec => {
    const text = JSON.stringify(rec).toLowerCase();
    text.split(/\W+/).forEach(w => {
      if (w.length > 2) vocabularySet.add(w);
    });
  });

  return {
    analysis: {
      sampleText,
      tokens: rawTokens,
      stopwordsRemoved,
      lemmatizedTokens,
      chunksCount: chunks.length,
      vocabularySize: vocabularySet.size
    },
    chunks
  };
}
