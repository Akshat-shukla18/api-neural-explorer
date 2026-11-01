# API Neural Network — Security Model

## 1. Threat Model & Safeguards

As a developer platform that interacts with arbitrary remote APIs, API Neural Network enforces defense-in-depth across the data flow:

---

### 1.1 Server-Side Request Forgery (SSRF) & Metadata Protection
- **Protocol Restriction**: Only `http:` and `https:` schemes are allowed. Schemes such as `file:`, `javascript:`, and `data:` are rejected immediately.
- **Cloud Metadata Guard**:
  - The link-local metadata IP `169.254.169.254` (used by AWS, Azure, DigitalOcean, and GCP) is explicitly blocked.
  - The domain `metadata.google.internal` is blocked.
- **Port & Target Validation**: URLs are validated using the standard `URL` parser before network dispatch.

---

### 1.2 Prototype Pollution & Code Injection
- Natural language query filter planning parses input into AST filters.
- **Disallowed Field Names**: Property keys such as `__proto__`, `constructor`, `prototype`, `eval`, and `script` are prohibited.
- **Field Name Character Whitelist**: Field expressions must strictly match `/^[a-zA-Z0-9_.]+$/`.

---

### 1.3 Denial of Service & Resource Exhaustion
- **Fetch Timeouts**: Requests automatically abort after 15,000 ms using `AbortController`.
- **Payload Size Caps**: Ingestion checks `Content-Length` headers and actual payload byte buffers, enforcing a 5 MB ceiling.
- **Bounded Chunking**: Records exceeding chunk boundaries are split into sliding windows rather than feeding unbounded context into the model.

---

### 1.4 API Keys & Credential Isolation
- External LLM API keys entered in settings are kept in memory and never persisted in source code, committed files, or client bundle builds.
- Keys are transmitted directly over HTTPS to provider endpoints (Google Gemini, OpenAI).

