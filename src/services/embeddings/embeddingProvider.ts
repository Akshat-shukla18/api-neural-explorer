import type { EmbeddingProvider } from '../../types';

/**
 * Validates that an embedding is a finite, normalized vector with matching dimensions.
 */
export function validateAndNormalizeVector(vector: number[], expectedDimensions: number): number[] {
  if (!Array.isArray(vector) || vector.length !== expectedDimensions) {
    throw new Error(
      `Vector dimension mismatch: expected ${expectedDimensions}, received ${vector?.length ?? 0}`
    );
  }

  let normSquare = 0;
  for (let i = 0; i < vector.length; i++) {
    const val = vector[i];
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new Error(`Invalid non-finite value in vector at index ${i}: ${val}`);
    }
    normSquare += val * val;
  }

  const norm = Math.sqrt(normSquare);
  if (norm === 0) {
    return new Array(expectedDimensions).fill(0);
  }

  return vector.map(v => Number((v / norm).toFixed(6)));
}

/**
 * High-dimensional semantic feature projection model (384 dimensions).
 * Uses dual-hash n-gram and sub-linear term-frequency projection with L2 normalization.
 * Honestly identified as 'semantic-feature-extractor-384d'.
 */
export class SemanticFeatureProvider implements EmbeddingProvider {
  public readonly providerId = 'semantic-feature';
  public readonly modelId = 'semantic-feature-extractor-384d';
  public readonly dimensions = 384;

  private projectText(text: string): number[] {
    const vector = new Float64Array(this.dimensions);
    const cleaned = text.toLowerCase().trim();

    if (!cleaned) {
      return Array.from(vector);
    }

    // Tokenize into words
    const words = cleaned.split(/[^a-z0-9_-]+/).filter(w => w.length > 0);
    const termFreq: Record<string, number> = {};

    words.forEach(w => {
      termFreq[w] = (termFreq[w] || 0) + 1;
      // Also capture character n-grams for subword semantics
      for (let i = 0; i <= w.length - 3; i++) {
        const trigram = `_${w.slice(i, i + 3)}_`;
        termFreq[trigram] = (termFreq[trigram] || 0) + 0.5;
      }
    });

    for (const [term, freq] of Object.entries(termFreq)) {
      const weight = 1 + Math.log(freq);

      // Hash term into dimension space using two independent seed hashes
      let h1 = 0x811c9dc5;
      let h2 = 0x27d4eb2f;

      for (let i = 0; i < term.length; i++) {
        const c = term.charCodeAt(i);
        h1 = (h1 ^ c) * 0x01000193;
        h2 = (h2 ^ c) * 0x5bd1e995;
      }

      const idx1 = Math.abs(h1) % this.dimensions;
      const idx2 = Math.abs(h2) % this.dimensions;
      const sign = (h1 & 1) === 0 ? 1 : -1;

      vector[idx1] += sign * weight;
      vector[idx2] += -sign * weight * 0.7;
    }

    return validateAndNormalizeVector(Array.from(vector), this.dimensions);
  }

  public async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map(t => this.projectText(t));
  }

  public async embedQuery(text: string): Promise<number[]> {
    return this.projectText(text);
  }
}

/**
 * Pretrained all-MiniLM-L6-v2 transformer model loaded dynamically via Transformers.js / CDN.
 */
export class TransformersEmbeddingProvider implements EmbeddingProvider {
  public readonly providerId = 'local-minilm';
  public readonly modelId = 'sentence-transformers/all-MiniLM-L6-v2';
  public readonly dimensions = 384;
  private pipelineInstance: any = null;
  private initPromise: Promise<void> | null = null;

  private async getPipeline(): Promise<any> {
    if (this.pipelineInstance) return this.pipelineInstance;

    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          // Dynamic import of transformers.js (compatible with Vite web runtime)
          const pkgName = '@huggingface/transformers';
          const transformers = await import(/* @vite-ignore */ pkgName).catch(() => null);
          if (!transformers || !transformers.pipeline) {
            throw new Error('@huggingface/transformers is not loaded in this environment.');
          }
          this.pipelineInstance = await transformers.pipeline(
            'feature-extraction',
            'Xenova/all-MiniLM-L6-v2'
          );
        } catch (err) {
          throw new Error(
            `Failed to load pretrained neural model ${this.modelId}: ${(err as Error).message}`
          );
        }
      })();
    }

    await this.initPromise;
    return this.pipelineInstance;
  }

  public async embedDocuments(texts: string[]): Promise<number[][]> {
    const pipe = await this.getPipeline();
    const results: number[][] = [];

    for (const text of texts) {
      const output = await pipe(text, { pooling: 'mean', normalize: true });
      const rawVector = Array.from(output.data as Float32Array).slice(0, this.dimensions);
      results.push(validateAndNormalizeVector(rawVector, this.dimensions));
    }

    return results;
  }

  public async embedQuery(text: string): Promise<number[]> {
    const pipe = await this.getPipeline();
    const output = await pipe(text, { pooling: 'mean', normalize: true });
    const rawVector = Array.from(output.data as Float32Array).slice(0, this.dimensions);
    return validateAndNormalizeVector(rawVector, this.dimensions);
  }
}

/**
 * Remote API Embedding Provider (for OpenAI, Gemini, Ollama).
 */
export class RemoteApiEmbeddingProvider implements EmbeddingProvider {
  public readonly providerId: string;
  public readonly modelId: string;
  public readonly dimensions: number;
  private readonly apiKey?: string;
  private readonly endpoint?: string;

  constructor(config: { provider: string; modelId: string; dimensions?: number; apiKey?: string; endpoint?: string }) {
    this.providerId = config.provider;
    this.modelId = config.modelId;
    this.dimensions = config.dimensions || 384;
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint;
  }

  public async embedDocuments(texts: string[]): Promise<number[][]> {
    if (!this.endpoint && !this.apiKey) {
      throw new Error(`Remote embedding provider ${this.providerId} requires API key or endpoint.`);
    }

    // Call standard OpenAI-compatible or Ollama embeddings endpoint
    const url = this.endpoint || 'https://api.openai.com/v1/embeddings';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: this.modelId,
        input: texts
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error ${response.status}: ${await response.text()}`);
    }

    const json = await response.json();
    return json.data.map((item: { embedding: number[] }) =>
      validateAndNormalizeVector(item.embedding, this.dimensions)
    );
  }

  public async embedQuery(text: string): Promise<number[]> {
    const docs = await this.embedDocuments([text]);
    return docs[0];
  }
}

/**
 * Factory for creating configured embedding providers.
 */
let activeProvider: EmbeddingProvider = new SemanticFeatureProvider();

export function getActiveEmbeddingProvider(): EmbeddingProvider {
  return activeProvider;
}

export function setActiveEmbeddingProvider(provider: EmbeddingProvider): void {
  activeProvider = provider;
}

export const setEmbeddingProvider = setActiveEmbeddingProvider;

