# API Neural Network — Testing & Quality Assurance

## 1. Test Architecture

The testing framework is built with **Vitest**. All 7 test suites execute genuine computations:
- No mocked embeddings that return arbitrary numbers.
- No `Math.random()` similarity generators.
- Real cosine similarity calculation.
- Real URL validation and SSRF blocking.
- Real MCP tool execution and AST planning.

---

## 2. Test Suites Summary

| Test Suite File | Focus Area | Tests Count | Status |
| :--- | :--- | :---: | :---: |
| `tests/apiService.test.ts` | URL validation, SSRF guards, normalization, telemetry, demo isolation | 12 | Passing |
| `tests/jsonProcessingService.test.ts` | Deterministic FNV-1a hashing, deep path discovery, sliding chunker | 6 | Passing |
| `tests/embeddingService.test.ts` | Semantic feature extractor, L2 normalization, cosine similarity math | 6 | Passing |
| `tests/vectorStore.test.ts` | IndexedDB persistence, atomic reindexing, source isolation | 4 | Passing |
| `tests/mcpTools.test.ts` | Schema validation, `api.fetch`, `api.search`, `api.retrieve`, `api.filter` | 6 | Passing |
| `tests/operationPlanner.test.ts` | Natural-language query AST planning, prototype injection defense | 8 | Passing |
| `tests/e2ePipeline.test.ts` | Full end-to-end integration: Ingest -> Chunk -> Embed -> Index -> Search -> RAG | 1 | Passing |
| **Total** | | **43** | **100% Passing** |

---

## 3. Running Test Commands

```bash
# Run all 43 tests
npm test

# Run tests with coverage
npx vitest run --coverage

# Run specific suite
npx vitest run tests/e2ePipeline.test.ts
```

