# API Neural Network — Model Context Protocol (MCP) Tools

## 1. Overview

API Neural Network implements a genuine local MCP tool registry that exposes indexed API data and vector capabilities to AI agents and natural language queries.

Every tool call:
- Validates inputs strictly against its schema.
- Executes real underlying services (fetch, vector search, indexed retrieval, metadata filtering).
- Records exact elapsed execution time via `performance.now()`.
- Reports true status: `'SUCCESS'` or `'FAILED'`.

---

## 2. Tool Catalog & Schemas

### 2.1 `api.fetch()`
Fetches and normalizes records from an HTTP endpoint or demo dataset.

- **Parameters**:
  - `url` (`string`, required): Target API URL or demo URI.
  - `mode` (`string`, optional, `['live', 'demo']`, default: `'live'`).
  - `headers` (`object`, optional): Request headers.
  - `params` (`object`, optional): Query string parameters.
- **Example Response**:
  ```json
  {
    "tool": "api.fetch()",
    "status": "SUCCESS",
    "resultCount": 100,
    "latencyMs": 142,
    "data": { "recordsCount": 100, "status": 200 }
  }
  ```

---

### 2.2 `api.search()`
Embeds a natural language query and searches the indexed vector database using cosine similarity.

- **Parameters**:
  - `query` (`string`, required): Natural-language query string.
  - `limit` (`number`, optional, default: 4, range: 1–50).
  - `threshold` (`number`, optional, default: 0.0, range: 0.0–1.0).
  - `sourceId` (`string`, optional): Source namespace filter.
- **Example Response**:
  ```json
  {
    "tool": "api.search()",
    "status": "SUCCESS",
    "resultCount": 3,
    "latencyMs": 14,
    "data": [
      {
        "id": "chunk-products-4-0",
        "recordId": 4,
        "recordTitle": "Sony WH-1000XM5",
        "similarity": 0.784,
        "content": "name: Sony WH-1000XM5 | category: Electronics | price: 29990"
      }
    ]
  }
  ```

---

### 2.3 `api.retrieve()`
Retrieves a specific record and its associated vector chunks by record ID.

- **Parameters**:
  - `recordId` (`string | number`, required): Unique identifier of the record.
  - `sourceId` (`string`, optional): Source namespace.
- **Example Response**:
  ```json
  {
    "tool": "api.retrieve()",
    "status": "SUCCESS",
    "resultCount": 1,
    "latencyMs": 2,
    "data": [
      {
        "recordId": 4,
        "content": "name: Sony WH-1000XM5 | price: 29990"
      }
    ]
  }
  ```

---

### 2.4 `api.filter()`
Filters indexed records using metadata field comparisons.

- **Parameters**:
  - `field` (`string`, required): Valid identifier path (e.g., `price`, `category`).
  - `operator` (`string`, required, `['eq', 'gt', 'gte', 'lt', 'lte', 'contains']`).
  - `value` (`string`, required): Comparison target.
  - `sourceId` (`string`, optional): Source namespace.
- **Example Response**:
  ```json
  {
    "tool": "api.filter()",
    "status": "SUCCESS",
    "resultCount": 2,
    "latencyMs": 3,
    "data": [ ... ]
  }
  ```

