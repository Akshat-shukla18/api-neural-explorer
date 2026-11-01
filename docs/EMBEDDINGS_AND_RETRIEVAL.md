# API Neural Network — Embeddings & Vector Retrieval

## 1. Embedding Provider Architecture

API Neural Network decouples embedding generation into a multi-provider interface:

```typescript
export interface EmbeddingProvider {
  readonly providerId: string;
  readonly modelId: string;
  readonly dimensions: number;
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}
```

### 1.1 Providers

1. **SemanticFeatureProvider (`semantic-feature-extractor-384d`)**:
   - High-dimensional 384-dimensional dense semantic feature extractor.
   - Computes dual-hash n-gram and sub-linear term frequency projections.
   - Applies Euclidean L2 unit normalization ($\|v\|_2 = 1.0$).
   - 100% deterministic, zero external native C++ toolchain dependencies, runs instantly on all browsers and platforms.
2. **TransformersEmbeddingProvider (`Xenova/all-MiniLM-L6-v2`)**:
   - Dynamic ESM ONNX runtime provider for Hugging Face Transformers.js.
   - Produces genuine transformer-based embeddings.
3. **RemoteApiEmbeddingProvider**:
   - Integrates remote embedding endpoints (OpenAI `text-embedding-3-small`, Google Gemini embeddings, Ollama `nomic-embed-text`).

---

## 2. Vector Mathematics & Cosine Similarity

### 2.1 L2 Unit Normalization
Every vector generated is normalized before storage:

$$\hat{v} = \frac{v}{\sqrt{\sum_{i=1}^{D} v_i^2}}$$

### 2.2 Mathematical Cosine Similarity
Similarity between query vector $A$ and chunk vector $B$ is computed strictly via:

$$\text{similarity}(A, B) = \frac{A \cdot B}{\|A\|_2 \|B\|_2} = \frac{\sum_{i=1}^{D} A_i B_i}{\sqrt{\sum_{i=1}^{D} A_i^2} \sqrt{\sum_{i=1}^{D} B_i^2}}$$

- **Zero Random Perturbation**: No `Math.random()` score inflation.
- **Clamped Range**: Clamped between `-1.0` and `1.0` to guard against floating-point boundary rounding.

---

## 3. Persistent Vector Storage (IndexedDB + In-Memory Index)

The vector store provides two layers:
1. **In-Memory HNSW/Cosine Map**: Fast $O(N)$ similarity evaluation with sub-millisecond retrieval.
2. **IndexedDB Object Store**: Browser-persistent persistence across page reloads under database `ApiNeuralNetwork_VectorDB`.

### Namespace Isolation
Each record indexed contains `sourceUrl` and `sourceId`. Similarity search requests can specify a target source, ensuring queries for API $A$ never return vectors belonging to API $B$.

