# API Neural Network 🚀

> **Turn any JSON REST API into a real, observable neural AI knowledge system.**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-43%20Passed-brightgreen?logo=vitest&logoColor=white)](https://vitest.dev/)
[![React Flow](https://img.shields.io/badge/React_Flow-12.4-FF007A?logo=react&logoColor=white)](https://reactflow.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MCP Protocol](https://img.shields.io/badge/MCP_Protocol-v2024--11--26-10B981)](https://modelcontextprotocol.io/)

**API Neural Network** is an enterprise-grade developer observability platform and grounded semantic retrieval engine that transforms live JSON REST APIs into queryable vector embeddings with real-time Model Context Protocol (MCP) tool execution.

Unlike mock demonstrations that simulate delays or fabricate similarity scores, API Neural Network performs **100% genuine operations**: real HTTP fetches, deterministic JSON chunking, 384-dimensional dense semantic embeddings, persistent vector storage with source namespace isolation, and fact-checked RAG responses citing exact records.

---

## 🌟 Key Features

- **🌐 Genuine Live Ingestion**: Ingest real REST APIs (e.g. JSONPlaceholder, DummyJSON) with AbortController timeouts, 5 MB payload caps, deep field-path discovery, and strict SSRF blocking. Never silently substitutes sample data on fetch errors.
- **📦 Deterministic JSON Chunking**: Sliding-window chunker with configurable overlap, field-path preservation, and FNV-1a content hashing.
- **🔢 Real 384-Dimensional Embeddings**: Euclidean $L_2$ unit-normalized vectors ($\|v\|_2 = 1.0$) with mathematical cosine similarity. Zero random scores.
- **🗄️ Persistent Vector Store**: IndexedDB browser storage with in-memory cosine indexing, atomic source re-indexing, and source namespace isolation.
- **🔌 Genuine Model Context Protocol (MCP) Server**: 4 dispatchable tools (`api.fetch()`, `api.search()`, `api.retrieve()`, `api.filter()`) with strict JSON schema parameter validation and real execution latency tracking via `performance.now()`.
- **🧠 Natural-Language Operation Planner**: Parses queries into a validated `ApiOperation` AST (fetch, search, filter, retrieve) with prototype pollution and code injection guards.
- **🤖 Grounded RAG & Citations**: Zero-key deterministic synthesizer citing exact records (`[Record #id]`) and specific field paths, or external LLMs (Google Gemini, OpenAI, Ollama).
- **🎨 Responsive Dual-Theme Workstation**: Supports both desktop workstation multi-pane layout and fully responsive mobile view (API Data → Pipeline → AI Query → Live Trace).

---

## 🔬 The 10-Stage Pipeline: Step-by-Step Architecture

```
API INGESTION ──► JSON PARSER ──► NLP PREPROCESSOR ──► TOKENIZER ──► CHUNKER
                                                                        │
LLM RESPONSE ◄── RAG RETRIEVAL ◄── MCP SERVER ◄── VECTOR DB ◄── EMBEDDINGS
```

1. **API Ingestion**: Genuine HTTP fetch with timeout and SSRF protection. Explicit `live` vs `demo` modes.
2. **JSON Parser**: AST structure validation, root field discovery, nested object counters, null telemetry.
3. **NLP Preprocessor**: Stopword removal and lexical frequency profiling.
4. **Tokenizer & Lemmatizer**: Inflection stripping and vocabulary indexing.
5. **Deterministic Chunker**: Bounded sliding-window chunk generation with FNV-1a hashing.
6. **Embedding Engine**: 384-d semantic feature extraction with $L_2$ normalization and vector waveform generation.
7. **Vector Database**: Persistent IndexedDB storage with in-memory cosine matrix indexing.
8. **MCP Server**: Tool registry with schema validation and dispatchable execution.
9. **RAG Retrieval**: Cosine similarity thresholding and candidate ranking.
10. **LLM Inference**: Grounded answer synthesis citing exact source record attributes.

---

## 🚀 Quickstart & Setup

### Prerequisites
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/Akshat-shukla18/api-neural-explorer.git
cd api-neural-explorer

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 🧪 Testing

The platform includes full Vitest test coverage:

```bash
# Run all 43 tests
npm test

# Type checking
npm run lint

# Production build
npm run build
```

---

## 📚 Technical Documentation

Comprehensive architectural and implementation guides are available in the `docs/` directory:

- [System Architecture](docs/ARCHITECTURE.md) — Architectural diagrams, data flow, component interactions.
- [Local Setup Guide](docs/LOCAL_SETUP.md) — Dependencies, environment setup, and verification.
- [API Connectors](docs/API_CONNECTORS.md) — Endpoint specifications, JSON normalization, live vs demo modes.
- [Embeddings & Vector Retrieval](docs/EMBEDDINGS_AND_RETRIEVAL.md) — Math, providers, $L_2$ normalization, cosine metric.
- [MCP Tools Specification](docs/MCP_TOOLS.md) — Tool catalog, JSON schemas, execution traces.
- [Testing & Quality Assurance](docs/TESTING.md) — Test suites, coverage, verification commands.
- [Security Model](docs/SECURITY.md) — SSRF guards, prototype pollution defense, secret isolation.
- [Implementation Audit](docs/IMPLEMENTATION_AUDIT.md) — Initial audit of the legacy codebase and migration record.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
