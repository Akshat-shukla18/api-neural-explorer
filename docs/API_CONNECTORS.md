# API Neural Network — API Connectors Specification

## 1. Supported Endpoints & Data Structures

API Neural Network can ingest any compliant JSON HTTP/HTTPS REST endpoint. The normalization engine supports:

1. **Root JSON Arrays**:
   ```json
   [
     { "id": 1, "title": "Post 1", "body": "..." },
     { "id": 2, "title": "Post 2", "body": "..." }
   ]
   ```
2. **Objects containing candidate collection arrays**:
   ```json
   {
     "status": "success",
     "total": 100,
     "data": [
       { "id": 101, "name": "Item A" }
     ]
   }
   ```
   *Candidate keys checked in order: `data`, `items`, `results`, `records`, `products`, `users`, `posts`, `entries`.*
3. **Single Resource Objects**:
   ```json
   {
     "id": 42,
     "name": "Single Resource",
     "category": "Diagnostics"
   }
   ```

---

## 2. Ingestion Modes: Live vs Demo

To guarantee integrity and reproducibility, the system enforces strict mode isolation:

| Feature | Live Mode (`mode: 'live'`) | Demo Mode (`mode: 'demo'`) |
| :--- | :--- | :--- |
| **Source** | Network HTTP/HTTPS GET request | Verified in-memory fixture datasets |
| **Fallback on Error** | **None** — Returns real HTTP/Network error | None |
| **Offline Compatible** | Requires network connectivity | Yes (works offline) |
| **Sample Datasets** | N/A | Products, Users, Transactions |

> [!IMPORTANT]
> **Zero Silent Fallback**: If a live request to an endpoint fails (e.g., DNS error, HTTP 404, CORS blockage), the application will **never** silently fall back to sample product data. The genuine error status, code, and message will be displayed.

---

## 3. Recommended Public REST APIs for Testing

1. **JSONPlaceholder**:
   - `https://jsonplaceholder.typicode.com/posts` (100 blog posts)
   - `https://jsonplaceholder.typicode.com/users` (10 users with nested addresses)
2. **DummyJSON**:
   - `https://dummyjson.com/products` (30 products in a `{ products: [] }` wrapper)
3. **Rick and Morty API**:
   - `https://rickandmortyapi.com/api/character` (Characters array in `{ results: [] }`)

---

## 4. Ingestion Constraints & Safety Limits

- **Default Timeout**: 15,000 ms (configurable via `options.timeoutMs`).
- **Maximum Payload Size**: 5,242,880 bytes (5 MB, configurable via `options.maxSizeBytes`).
- **Protocols**: Strictly `http:` and `https:`.
- **SSRF Blocklist**: Cloud metadata IP `169.254.169.254` and `metadata.google.internal` are immediately rejected.

