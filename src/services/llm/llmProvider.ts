import type { ApiRecord, ChatMessage, RagChunk, LlmConfig } from '../../types';

export interface LlmCompletionRequest {
  userQuery: string;
  contextChunks: RagChunk[];
  allRecords?: ApiRecord[];
  sourceUrl?: string;
}

export interface LlmCompletionResult {
  text: string;
  sources: NonNullable<ChatMessage['sources']>;
  isGrounded: boolean;
  citedRecordIds: (string | number)[];
}

export interface ILlmProvider {
  readonly providerId: string;
  readonly modelId: string;
  generateAnswer(
    requestOrQuery: LlmCompletionRequest | string,
    chunks?: RagChunk[],
    records?: ApiRecord[]
  ): Promise<LlmCompletionResult>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse a single record from a chunk's text content back into key/value pairs. */
function parseFieldsFromContent(content: string): Record<string, string> {
  const fields: Record<string, string> = {};
  // Chunk content typically looks like "field: value | field: value | …"
  const parts = content.split(/\s*\|\s*/);
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx > 0) {
      const key = part.slice(0, colonIdx).trim().toLowerCase();
      const val = part.slice(colonIdx + 1).trim();
      if (key && val) fields[key] = val;
    }
  }
  return fields;
}

/** Extract a typed value for a given field key from a record or its metadata. */
function getFieldValue(record: ApiRecord | Record<string, unknown>, field: string): unknown {
  const fieldLower = field.toLowerCase();
  // Direct key match (case-insensitive)
  for (const k of Object.keys(record)) {
    if (k.toLowerCase() === fieldLower) return record[k];
  }
  return undefined;
}

/** Attempt to get a numeric value from the record. */
function getNumericField(record: ApiRecord | Record<string, unknown>, field: string): number | undefined {
  const v = getFieldValue(record, field);
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[₹$€£,]/g, ''));
    if (!isNaN(n)) return n;
  }
  return undefined;
}

/** Build a one-line summary of a record from its key fields. */
function summarizeRecord(rec: ApiRecord): string {
  const parts: string[] = [];
  const name = rec.name || rec.title || rec.label || rec.productName || rec.product_name;
  if (name) parts.push(String(name));

  const price = rec.price ?? rec.amount ?? rec.cost;
  if (price !== undefined) parts.push(`Price: ${typeof price === 'number' ? price.toLocaleString() : price}`);

  const cat = rec.category ?? rec.type ?? rec.department ?? rec.group;
  if (cat) parts.push(`Category: ${cat}`);

  const rating = rec.rating ?? rec.score ?? rec.stars;
  if (rating !== undefined) parts.push(`Rating: ${rating}`);

  const stock = rec.stock ?? rec.quantity ?? rec.inventory;
  if (stock !== undefined) parts.push(`Stock: ${stock}`);

  const sku = rec.sku ?? rec.SKU ?? rec.code;
  if (sku) parts.push(`SKU: ${sku}`);

  return parts.length > 0 ? parts.join(' | ') : JSON.stringify(rec).slice(0, 150);
}

/** Compare values with an operator. */
function compareValues(actual: unknown, operator: string, target: string): boolean {
  // numeric comparisons
  const numActual = typeof actual === 'number' ? actual : parseFloat(String(actual).replace(/[₹$€£,]/g, ''));
  const numTarget = parseFloat(target.replace(/[₹$€£,]/g, ''));
  if (!isNaN(numActual) && !isNaN(numTarget)) {
    switch (operator) {
      case '>': case 'gt': return numActual > numTarget;
      case '>=': case 'gte': return numActual >= numTarget;
      case '<': case 'lt': return numActual < numTarget;
      case '<=': case 'lte': return numActual <= numTarget;
      case '=': case '==': case 'eq': return numActual === numTarget;
    }
  }
  // string comparisons
  const strActual = String(actual).toLowerCase();
  const strTarget = target.toLowerCase();
  if (operator === 'contains' || operator === 'includes') return strActual.includes(strTarget);
  if (operator === '=' || operator === '==' || operator === 'eq') return strActual === strTarget;
  return false;
}

// ─── Query Interpretation ─────────────────────────────────────────────────────

interface ParsedIntent {
  type: 'count' | 'list' | 'filter' | 'details' | 'top' | 'bottom' | 'categories' | 'summary' | 'general';
  field?: string;
  operator?: string;
  value?: string;
  limit?: number;
  sortDir?: 'asc' | 'desc';
}

function interpretQuery(query: string): ParsedIntent {
  const q = query.toLowerCase().trim();

  // Count questions: "how many", "count", "total number"
  if (/\b(?:how many|count|total\s+number|number\s+of)\b/.test(q)) {
    // "how many products have price > 300"
    const filterMatch = q.match(/(?:how many|count).*?\b(\w+)\s*(?:>|greater|above|more than)\s*[₹$€£]?\s*([\d,.]+)/);
    if (filterMatch) {
      return { type: 'count', field: filterMatch[1], operator: '>', value: filterMatch[2] };
    }
    const catMatch = q.match(/(?:how many|count).*?(?:in|with|of)\s+(?:category\s+)?["']?(\w[\w\s]*)["']?/);
    if (catMatch) {
      return { type: 'count', field: 'category', operator: 'eq', value: catMatch[1].trim() };
    }
    return { type: 'count' };
  }

  // "list all categories", "what are the categories", "show categories", "unique categories"
  if (/\b(?:list|show|what\s+are|unique|distinct)\b.*?\b(?:categories|types|groups|departments)\b/.test(q) ||
      /\b(?:categories|types|groups)\b.*?\b(?:list|available|there)\b/.test(q)) {
    return { type: 'categories' };
  }

  // Top/Bottom N: "top 5 most expensive", "cheapest 3", "highest rated"
  const topMatch = q.match(/\b(?:top|most\s+expensive|highest|best|largest|greatest)\s*(\d+)?/);
  if (topMatch && /\b(?:expensive|price|cost|rating|rated|stock)\b/.test(q)) {
    const field = /\b(?:rating|rated|score)\b/.test(q) ? 'rating' : /\b(?:stock|inventory|quantity)\b/.test(q) ? 'stock' : 'price';
    return { type: 'top', field, limit: topMatch[1] ? parseInt(topMatch[1]) : 5, sortDir: 'desc' };
  }
  const bottomMatch = q.match(/\b(?:bottom|cheapest|lowest|least|smallest|worst)\s*(\d+)?/);
  if (bottomMatch && /\b(?:cheap|price|cost|rating|rated|stock)\b/.test(q)) {
    const field = /\b(?:rating|rated|score)\b/.test(q) ? 'rating' : /\b(?:stock|inventory|quantity)\b/.test(q) ? 'stock' : 'price';
    return { type: 'bottom', field, limit: bottomMatch[1] ? parseInt(bottomMatch[1]) : 5, sortDir: 'asc' };
  }

  // Filter: "price > 400", "category is electronics", "rating above 4"
  const filterPatterns = [
    /\b(\w+)\s*(?:>|greater\s+than|above|more\s+than|over)\s*[₹$€£]?\s*([\d,.]+)/,
    /\b(\w+)\s*(?:<|less\s+than|below|under)\s*[₹$€£]?\s*([\d,.]+)/,
    /\b(\w+)\s*(?:=|equals?|is)\s*["']?(\w[\w\s]*)["']?/,
  ];
  for (const pattern of filterPatterns) {
    const m = q.match(pattern);
    if (m) {
      let op = '>';
      if (/(?:<|less|below|under)/.test(q.slice(m.index || 0, (m.index || 0) + m[0].length))) op = '<';
      else if (/(?:=|equals?|\bis\b)/.test(q.slice(m.index || 0, (m.index || 0) + m[0].length))) op = 'eq';
      return { type: 'filter', field: m[1], operator: op, value: m[2].trim() };
    }
  }

  // Detail: "show details for record #5", "retrieve record 12"
  const detailMatch = q.match(/\b(?:show|get|retrieve|details?\s+(?:for|of)?|record)\s*#?\s*(\d+)/);
  if (detailMatch) {
    return { type: 'details', value: detailMatch[1] };
  }

  // Summary: "summarize", "overview", "describe"
  if (/\b(?:summarize|summary|overview|describe|tell\s+me\s+about)\b/.test(q)) {
    return { type: 'summary' };
  }

  // Generic list: "show all", "list items", "find"
  if (/\b(?:show\s+all|list\s+all|list\s+items|find\s+all|display)\b/.test(q)) {
    return { type: 'list' };
  }

  return { type: 'general' };
}


/**
 * Transparent, deterministic Grounded Retrieval Provider.
 * Requires zero API keys; synthesizes an accurate, fact-checked response
 * strictly using retrieved chunks and structured field matching.
 */
export class RetrievalOnlyLlmProvider implements ILlmProvider {
  public readonly providerId = 'retrieval-only';
  public readonly modelId = 'grounded-retrieval-synthesizer-v1';

  public async generateAnswer(
    requestOrQuery: LlmCompletionRequest | string,
    chunks?: RagChunk[],
    records?: ApiRecord[]
  ): Promise<LlmCompletionResult> {
    const request: LlmCompletionRequest = typeof requestOrQuery === 'string'
      ? { userQuery: requestOrQuery, contextChunks: chunks || [], allRecords: records || [] }
      : requestOrQuery;

    const { userQuery, contextChunks, allRecords = [] } = request;

    // Use allRecords as the primary structured data source — much richer than chunks
    const dataSource = allRecords.length > 0 ? allRecords : [];

    // 1. If no evidence was retrieved and no records available, honestly report
    if (contextChunks.length === 0 && dataSource.length === 0) {
      return {
        text: `No matching records were found in the connected API vector index for query: "${userQuery}". The evidence is insufficient to answer this request.`,
        sources: [],
        isGrounded: true,
        citedRecordIds: []
      };
    }

    const intent = interpretQuery(userQuery);

    // ── COUNT ──────────────────────────────────────────────────────────────
    if (intent.type === 'count') {
      if (intent.field && intent.operator && intent.value) {
        const matching = dataSource.filter(r => {
          const val = getFieldValue(r, intent.field!);
          return val !== undefined && compareValues(val, intent.operator!, intent.value!);
        });
        const sample = matching.slice(0, 5).map(r => `  • [Record #${r.id}] ${summarizeRecord(r)}`).join('\n');
        return this.buildResult(
          `Found **${matching.length}** record(s) where ${intent.field} ${intent.operator} ${intent.value} (out of ${dataSource.length} total).\n\n${sample}${matching.length > 5 ? `\n  … and ${matching.length - 5} more` : ''}`,
          matching.slice(0, 10)
        );
      }
      return this.buildResult(
        `The connected API contains **${dataSource.length}** total records.`,
        dataSource.slice(0, 5)
      );
    }

    // ── CATEGORIES ─────────────────────────────────────────────────────────
    if (intent.type === 'categories') {
      const categoryMap = new Map<string, number>();
      for (const r of dataSource) {
        const cat = String(r.category || r.type || r.department || r.group || 'Uncategorized');
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      }
      const sorted = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);
      const lines = sorted.map(([cat, count]) => `  • **${cat}** — ${count} item(s)`).join('\n');
      return this.buildResult(
        `Found **${sorted.length}** unique categories across ${dataSource.length} records:\n\n${lines}`,
        dataSource.slice(0, 5)
      );
    }

    // ── TOP / BOTTOM N ────────────────────────────────────────────────────
    if (intent.type === 'top' || intent.type === 'bottom') {
      const field = intent.field || 'price';
      const limit = intent.limit || 5;
      const withValues = dataSource
        .map(r => ({ record: r, value: getNumericField(r, field) }))
        .filter((x): x is { record: ApiRecord; value: number } => x.value !== undefined);

      withValues.sort((a, b) => intent.sortDir === 'asc' ? a.value - b.value : b.value - a.value);
      const top = withValues.slice(0, limit);
      const label = intent.type === 'top' ? 'highest' : 'lowest';
      const lines = top.map((x, i) => `  ${i + 1}. [Record #${x.record.id}] ${summarizeRecord(x.record)}`).join('\n');
      return this.buildResult(
        `**Top ${top.length} records by ${label} ${field}:**\n\n${lines}`,
        top.map(x => x.record)
      );
    }

    // ── FILTER ─────────────────────────────────────────────────────────────
    if (intent.type === 'filter' && intent.field && intent.operator && intent.value) {
      const matching = dataSource.filter(r => {
        const val = getFieldValue(r, intent.field!);
        if (val === undefined) return false;
        // Also check in arrays (e.g. tags)
        if (Array.isArray(val)) {
          return val.some(v => String(v).toLowerCase().includes(intent.value!.toLowerCase()));
        }
        return compareValues(val, intent.operator!, intent.value!);
      });

      if (matching.length === 0) {
        return this.buildResult(
          `No records found matching filter: ${intent.field} ${intent.operator} ${intent.value}. Searched ${dataSource.length} records.`,
          []
        );
      }

      const lines = matching.slice(0, 15).map(r => `  • [Record #${r.id}] ${summarizeRecord(r)}`).join('\n');
      return this.buildResult(
        `Found **${matching.length}** record(s) where **${intent.field} ${intent.operator} ${intent.value}**:\n\n${lines}${matching.length > 15 ? `\n  … and ${matching.length - 15} more` : ''}`,
        matching.slice(0, 10)
      );
    }

    // ── DETAILS ────────────────────────────────────────────────────────────
    if (intent.type === 'details' && intent.value) {
      const targetId = intent.value;
      const record = dataSource.find(r => String(r.id) === targetId);
      if (record) {
        const fields = Object.entries(record)
          .filter(([k]) => k !== '__proto__')
          .map(([k, v]) => {
            const display = Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
            return `  • **${k}**: ${display}`;
          }).join('\n');
        return this.buildResult(
          `**Details for Record #${targetId}:**\n\n${fields}`,
          [record]
        );
      }
      // Fall through to chunk-based response
    }

    // ── SUMMARY ────────────────────────────────────────────────────────────
    if (intent.type === 'summary') {
      const fieldKeys = new Set<string>();
      for (const r of dataSource.slice(0, 10)) {
        Object.keys(r).forEach(k => fieldKeys.add(k));
      }

      // Collect category stats
      const cats = new Map<string, number>();
      for (const r of dataSource) {
        const c = String(r.category || r.type || 'N/A');
        cats.set(c, (cats.get(c) || 0) + 1);
      }

      // Collect numeric stats
      const numericStats: string[] = [];
      for (const field of ['price', 'rating', 'stock', 'amount', 'cost', 'score']) {
        const vals = dataSource.map(r => getNumericField(r, field)).filter((v): v is number => v !== undefined);
        if (vals.length > 0) {
          const min = Math.min(...vals);
          const max = Math.max(...vals);
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          numericStats.push(`  • **${field}**: min=${min}, max=${max}, avg=${avg.toFixed(2)} (${vals.length} values)`);
        }
      }

      const catLines = [...cats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([c, n]) => `  • ${c}: ${n}`).join('\n');

      return this.buildResult(
        `**API Data Summary** (${dataSource.length} records)\n\n` +
        `**Fields:** ${[...fieldKeys].join(', ')}\n\n` +
        (numericStats.length > 0 ? `**Numeric Statistics:**\n${numericStats.join('\n')}\n\n` : '') +
        (cats.size > 0 ? `**Categories:**\n${catLines}` : ''),
        dataSource.slice(0, 5)
      );
    }

    // ── GENERAL / SEMANTIC SEARCH ──────────────────────────────────────────
    // For general queries, try keyword matching on chunks + records
    const queryTerms = userQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    // Score each record by keyword relevance
    const scored = dataSource.map(r => {
      const text = JSON.stringify(r).toLowerCase();
      let score = 0;
      for (const term of queryTerms) {
        if (text.includes(term)) score++;
      }
      // Boost records that appear in retrieved chunks
      for (const c of contextChunks) {
        if (String(c.recordId) === String(r.id)) {
          score += 3;
          break;
        }
      }
      return { record: r, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      const topResults = scored.slice(0, 8);
      const lines = topResults.map((x, i) =>
        `  ${i + 1}. [Record #${x.record.id}] ${summarizeRecord(x.record)} (relevance: ${x.score})`
      ).join('\n');
      return this.buildResult(
        `Found **${scored.length}** relevant record(s) for "${userQuery}":\n\n${lines}${scored.length > 8 ? `\n  … and ${scored.length - 8} more` : ''}`,
        topResults.map(x => x.record)
      );
    }

    // Fallback: describe what chunks were retrieved
    if (contextChunks.length > 0) {
      const chunkSummaries = contextChunks.slice(0, 5).map(c => {
        const fields = parseFieldsFromContent(c.content);
        const name = fields.name || fields.title || c.recordTitle || `Record #${c.recordId}`;
        return `  • [Record #${c.recordId}] **${name}** — similarity: ${c.similarity?.toFixed(3) ?? 'N/A'}\n    ${c.content.slice(0, 120)}`;
      }).join('\n\n');

      return this.buildResult(
        `Based on ${contextChunks.length} semantically retrieved chunk(s):\n\n${chunkSummaries}`,
        contextChunks.slice(0, 5).map(c => {
          const rec = dataSource.find(r => String(r.id) === String(c.recordId));
          return rec || { id: c.recordId } as ApiRecord;
        })
      );
    }

    return {
      text: `No matching records were found for: "${userQuery}". Try rephrasing your question or using specific field names from the API data.`,
      sources: [],
      isGrounded: true,
      citedRecordIds: []
    };
  }

  /** Helper: build a standardized result from matching records. */
  private buildResult(text: string, matchedRecords: ApiRecord[]): LlmCompletionResult {
    const sources: NonNullable<ChatMessage['sources']> = matchedRecords.slice(0, 10).map(r => ({
      id: r.id,
      name: String(r.name || r.title || r.label || `Record #${r.id}`),
      price: typeof r.price === 'number' ? r.price : undefined,
      category: r.category ? String(r.category) : undefined,
      snippet: summarizeRecord(r).slice(0, 160)
    }));

    return {
      text,
      sources,
      isGrounded: true,
      citedRecordIds: matchedRecords.map(r => r.id)
    };
  }
}

/**
 * External LLM Provider (OpenAI, Gemini, Ollama) with strict grounded context injection.
 */
export class ExternalLlmProvider implements ILlmProvider {
  public readonly providerId: string;
  public readonly modelId: string;
  private readonly apiKey?: string;
  private readonly endpoint?: string;

  constructor(config: LlmConfig) {
    this.providerId = config.provider;
    this.modelId = config.modelId;
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint;
  }

  public async generateAnswer(
    requestOrQuery: LlmCompletionRequest | string,
    chunks?: RagChunk[],
    records?: ApiRecord[]
  ): Promise<LlmCompletionResult> {
    const request: LlmCompletionRequest = typeof requestOrQuery === 'string'
      ? { userQuery: requestOrQuery, contextChunks: chunks || [], allRecords: records || [] }
      : requestOrQuery;

    const { userQuery, contextChunks } = request;

    if (contextChunks.length === 0) {
      return {
        text: `No matching records were retrieved from the API vector index for: "${userQuery}". Insufficient evidence.`,
        sources: [],
        isGrounded: true,
        citedRecordIds: []
      };
    }

    const contextText = contextChunks
      .map(c => `[Record #${c.recordId}] Title: ${c.recordTitle}\nContent: ${c.content}`)
      .join('\n\n---\n\n');

    const systemPrompt = `You are an AI assistant grounded strictly on API data.
MANDATORY RULES:
1. Answer the user question using ONLY the provided evidence below.
2. If the evidence does not contain the answer, say "The provided API data does not contain this information."
3. Every factual statement must cite its source record in the format [Record #ID].
4. Never invent or hallucinate records, fields, or values.`;

    const userPrompt = `EVIDENCE FROM CONNECTED API:\n${contextText}\n\nUSER QUESTION: ${userQuery}\n\nANSWER (cite records like [Record #ID]):`;

    const endpoint = this.endpoint || (
      this.providerId === 'gemini'
        ? `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent?key=${this.apiKey}`
        : 'https://api.openai.com/v1/chat/completions'
    );

    let answerText = '';

    if (this.providerId === 'gemini') {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error ${response.status}: ${await response.text()}`);
      }

      const json = await response.json();
      answerText = json.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer generated.';
    } else {
      // OpenAI / Ollama compatible
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: this.modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API Error ${response.status}: ${await response.text()}`);
      }

      const json = await response.json();
      answerText = json.choices?.[0]?.message?.content || 'No answer generated.';
    }

    const sources: NonNullable<ChatMessage['sources']> = contextChunks.map(c => ({
      id: c.recordId,
      name: c.recordTitle,
      price: c.price,
      category: c.category,
      snippet: c.content.slice(0, 100),
      fieldPaths: c.fieldPaths
    }));

    return {
      text: answerText,
      sources,
      isGrounded: true,
      citedRecordIds: contextChunks.map(c => c.recordId)
    };
  }
}

let activeLlmProvider: ILlmProvider = new RetrievalOnlyLlmProvider();

export function getActiveLlmProvider(): ILlmProvider {
  return activeLlmProvider;
}

export function setActiveLlmProvider(provider: ILlmProvider): void {
  activeLlmProvider = provider;
}
