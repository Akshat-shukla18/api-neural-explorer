# API Neural Explorer 🚀

> **Turn any JSON API into an observable AI knowledge system.**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Flow](https://img.shields.io/badge/React_Flow-12.4-FF007A?logo=react&logoColor=white)](https://reactflow.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MCP Protocol](https://img.shields.io/badge/MCP_Protocol-v2024--11--26-10B981)](https://modelcontextprotocol.io/)

**API Neural Explorer** is a developer-focused observability and visualization platform that turns any public JSON API into an interactive, real-time AI knowledge system. 

Instead of treating AI retrieval as a black box, API Neural Explorer visually demonstrates the complete end-to-end data pipeline: **API Ingestion → JSON AST Parsing → NLP Preprocessing → Tokenization → Chunking → Dense Embeddings → Vector Indexing → Model Context Protocol (MCP) Tool Calls → RAG Retrieval → Grounded LLM Response.**

---

## 🎨 Dual Theme Identity

API Neural Explorer includes a seamless theme switcher in the top navigation bar supporting two curated visual modes:

- ☀️ **Day Mode**: Crisp **Grey, White, and Black** developer-console aesthetic with high contrast slate borders and dark typography.
- 🌙 **Night Mode**: Futuristic **Black, White, and Matrix Green** theme with neon green glows (`#10b981`, `#00ff88`) and deep dark surfaces.

---

## 🔬 The 10-Stage Pipeline: Step-by-Step Explanation with Examples

Below is the complete architectural walkthrough of the 10-stage neural pipeline executed by the application:

```
API INGESTION ──► JSON PARSER ──► NLP PREPROCESSOR ──► TOKENIZER ──► CHUNKER
                                                                        │
LLM RESPONSE ◄── RAG RETRIEVAL ◄── MCP SERVER ◄── VECTOR DB ◄── EMBEDDINGS
```

---

### Stage 1: API Ingestion 🌐
- **What Happens**: The user enters any public JSON API URL (or selects a sample dataset like *Products API*, *Users API*, or *Transactions API*). The application executes an HTTP request, tracks network latency, validates response status codes, and profiles payload metrics.
- **Concrete Example**:
  - **Request**: `GET https://api.example.com/products`
  - **Telemetry Output**: `200 OK` in `180 ms` | Payload Size: `42.5 KB` | Total Records: `8`.

---

### Stage 2: JSON Parser 📄
- **What Happens**: Reads raw JSON strings, parses the Abstract Syntax Tree (AST), counts root fields, identifies nested structures, and calculates null value ratios.
- **Concrete Example**:
  ```json
  {
    "id": 1,
    "name": "Nike Air Max 270",
    "category": "Shoes",
    "price": 12999,
    "rating": 4.8,
    "description": "Running shoes designed for everyday comfort with max air cushioning unit."
  }
  ```
  - **Parser Output**: `6 root fields detected`, `0 nested objects`, `0 null values`.

---

### Stage 3: NLP Preprocessor 🧠
- **What Happens**: Extracts text attributes from raw records, normalizes character encoding, splits strings into raw tokens, and filters out common grammatical stopwords (`and`, `for`, `with`, `in`, `the`, etc.).
- **Concrete Example**:
  - **Input String**: `"Running shoes designed for everyday comfort"`
  - **Raw Tokens**: `["Running", "shoes", "designed", "for", "everyday", "comfort"]`
  - **Stopwords Filtered**: `["Running", "shoes", "designed", "everyday", "comfort"]` (word *"for"* removed).

---

### Stage 4: Tokenizer & Lemmatizer ✂️
- **What Happens**: Transforms filtered tokens into normalized root lemma forms (stemming), removing inflections so search terms match regardless of verb tenses or plural suffixes.
- **Concrete Example**:
  - **Filtered Tokens**: `["Running", "shoes", "designed"]`
  - **Lemmatized Output**: `["run", "shoe", "design"]`

---

### Stage 5: Chunker 📦
- **What Happens**: Divides whole JSON records into discrete text chunks using a sliding window strategy, attaching structural metadata (record IDs, prices, categories) to each chunk.
- **Concrete Example**:
  - **Chunk #01**: `id: chunk-1 | recordId: 1 | title: Nike Air Max 270 | category: Shoes | content: "name: Nike Air Max 270 | price: 12999 | category: Shoes | description: Running shoes designed for everyday comfort"`

---

### Stage 6: Embedding Engine 🔢
- **What Happens**: Passes text chunks through a 384-dimensional vector embedding model (`all-MiniLM-L6-v2`), generating dense float arrays. The UI renders an interactive **Vector Density Waveform** aggregated into 32 visual intensity buckets.
- **Concrete Example**:
  - **Vector Output (384 Dimensions)**: `[0.182, -0.092, 0.441, 0.029, 0.812, ...]`
  - **Waveform Buckets**: High intensity in buckets #4, #12, and #28 representing shoe/footwear semantic clusters.

---

### Stage 7: Vector Database 🗄️
- **What Happens**: Inserts generated dense vectors into an HNSW (Hierarchical Navigable Small World) matrix in memory for fast sub-millisecond cosine similarity queries.
- **Concrete Example**:
  - **Index Telemetry**: `8 vectors indexed successfully` | Metric: `Cosine Distance`.

---

### Stage 8: MCP Server (Model Context Protocol) 🔌
- **What Happens**: The MCP Server acts as the nervous system of the platform. It exposes dispatchable tools (`api.fetch()`, `api.search()`, `api.retrieve()`) that the LLM invokes dynamically when processing queries.
- **Concrete Example**:
  - **User Query**: *"Which products cost more than ₹10,000?"*
  - **MCP Tool Call Executed**: 
    ```typescript
    api.search({ query: "Which products cost more than ₹10,000?", limit: 4 })
    ```
  - **Execution Latency**: `42 ms` | Status: `SUCCESS`.

---

### Stage 9: RAG Retrieval (Retrieval-Augmented Generation) 🔍
- **What Happens**: Performs vector search between the query embedding and chunk index, returning top k-similar chunks with similarity scores (e.g., `0.91`, `0.87`) and rendering visual similarity progress bars.
- **Concrete Example**:
  - **Retrieved Context**:
    - **Chunk #01** (Similarity `0.91`): Nike Air Max 270 (Price: ₹12,999)
    - **Chunk #03** (Similarity `0.87`): Adidas Ultraboost Light (Price: ₹13,499)

---

### Stage 10: LLM Response & Grounded Source Citations 🤖
- **What Happens**: Generates a natural language answer grounded in the retrieved RAG context. Each claim includes clickable source cards that instantly highlight the exact record in the JSON data viewer.
- **Concrete Example**:
  - **LLM Output**: *"Based on the connected API, 4 products have a price above ₹10,000."*
  - **Clickable Sources**: 
    - `[Nike Air Max 270 — ₹12,999]`
    - `[Adidas Ultraboost Light — ₹13,499]`
    - `[Sony WH-1000XM5 — ₹29,990]`
    - `[Apple Watch Series 9 — ₹41,900]`

---

## 🛠️ Tech Stack

- **Core**: React 19, TypeScript, Vite
- **Graph & Visualization**: `@xyflow/react` (React Flow v12)
- **Styling**: Tailwind CSS v4, Vanilla CSS variables
- **Icons**: Lucide React
- **Animations**: Framer Motion & CSS keyframe data particles
- **Protocol**: Model Context Protocol (MCP v2024-11-26 specifications)

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Akshat-shukla18/api-neural-explorer.git
   cd api-neural-explorer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173/`

---

## 📦 Production Build

To compile a production bundle:

```bash
npm run build
```

The optimized static assets will be output to the `dist/` directory, ready for deployment on Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
