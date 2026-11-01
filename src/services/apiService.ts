import type { ApiFetchOptions, ApiFetchResult, ApiRecord, SampleApiOption } from '../types';

export const SAMPLE_PRODUCTS_DATA: ApiRecord[] = [
  {
    id: 1,
    name: "Nike Air Max 270",
    category: "Shoes",
    price: 12999,
    rating: 4.8,
    stock: 45,
    brand: "Nike",
    description: "Running shoes designed for everyday comfort with max air cushioning unit."
  },
  {
    id: 2,
    name: "Nike Pegasus 40",
    category: "Shoes",
    price: 11499,
    rating: 4.6,
    stock: 32,
    brand: "Nike",
    description: "Responsive road running shoes built with React foam for energy return."
  },
  {
    id: 3,
    name: "Adidas Ultraboost Light",
    category: "Shoes",
    price: 13499,
    rating: 4.7,
    stock: 28,
    brand: "Adidas",
    description: "Lightweight performance running shoes with signature Boost midsole support."
  },
  {
    id: 4,
    name: "Sony WH-1000XM5",
    category: "Electronics",
    price: 29990,
    rating: 4.9,
    stock: 18,
    brand: "Sony",
    description: "Industry leading noise canceling wireless headphones with dual processors."
  },
  {
    id: 5,
    name: "Apple Watch Series 9",
    category: "Electronics",
    price: 41900,
    rating: 4.8,
    stock: 15,
    brand: "Apple",
    description: "Advanced health monitoring smartwatch featuring S9 SIP chip and Double Tap gesture."
  },
  {
    id: 6,
    name: "Logitech MX Master 3S",
    category: "Accessories",
    price: 8995,
    rating: 4.7,
    stock: 60,
    brand: "Logitech",
    description: "Ergonomic wireless performance mouse with 8K DPI track-on-glass sensor."
  },
  {
    id: 7,
    name: "Keychron K2 Pro Mechanical Keyboard",
    category: "Accessories",
    price: 9499,
    rating: 4.5,
    stock: 40,
    brand: "Keychron",
    description: "QMK/VIA wireless mechanical keyboard with hot-swappable tactile switches."
  },
  {
    id: 8,
    name: "Dell UltraSharp 27 4K Monitor",
    category: "Electronics",
    price: 48990,
    rating: 4.8,
    stock: 12,
    brand: "Dell",
    description: "Color-accurate 4K IPS hub monitor with 90W USB-C power delivery and HDR400."
  }
];

export const SAMPLE_USERS_DATA: ApiRecord[] = [
  {
    id: 101,
    name: "Alex Rivera",
    role: "Senior AI Engineer",
    department: "Infrastructure",
    location: "San Francisco, CA",
    status: "Active",
    queriesCount: 1420
  },
  {
    id: 102,
    name: "Elena Rostova",
    role: "MLOps Lead",
    department: "Data Platform",
    location: "London, UK",
    status: "Active",
    queriesCount: 980
  },
  {
    id: 103,
    name: "Devon Chen",
    role: "Backend Architect",
    department: "Core API",
    location: "Austin, TX",
    status: "Active",
    queriesCount: 2310
  },
  {
    id: 104,
    name: "Sarah Jenkins",
    role: "Product Designer",
    department: "UX Systems",
    location: "Seattle, WA",
    status: "Away",
    queriesCount: 450
  }
];

export const SAMPLE_TRANSACTIONS_DATA: ApiRecord[] = [
  {
    id: "TX-9901",
    amount: 12999,
    currency: "INR",
    type: "Purchase",
    status: "Completed",
    gateway: "Stripe",
    timestamp: "2026-08-20T10:14:00Z"
  },
  {
    id: "TX-9902",
    amount: 29990,
    currency: "INR",
    type: "Purchase",
    status: "Completed",
    gateway: "Razorpay",
    timestamp: "2026-08-20T10:18:22Z"
  },
  {
    id: "TX-9903",
    amount: 41900,
    currency: "INR",
    type: "Refund",
    status: "Pending",
    gateway: "PayPal",
    timestamp: "2026-08-20T10:25:40Z"
  }
];

export const SAMPLE_APIS: SampleApiOption[] = [
  {
    id: 'products',
    name: 'Products API',
    description: 'Catalog of 8 premium consumer products & electronics',
    url: 'https://api.example.com/products',
    sampleData: SAMPLE_PRODUCTS_DATA
  },
  {
    id: 'users',
    name: 'Users API',
    description: 'Engineering team directory with roles & stats',
    url: 'https://api.example.com/users',
    sampleData: SAMPLE_USERS_DATA
  },
  {
    id: 'transactions',
    name: 'Transactions API',
    description: 'Financial ledger of recent payment events',
    url: 'https://api.example.com/transactions',
    sampleData: SAMPLE_TRANSACTIONS_DATA
  }
];

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export class ApiIngestionError extends Error {
  public readonly status?: number;
  public readonly code: string;
  public readonly originalError?: unknown;

  constructor(message: string, code: string, status?: number, originalError?: unknown) {
    super(message);
    this.name = 'ApiIngestionError';
    this.code = code;
    this.status = status;
    this.originalError = originalError;
  }
}

/**
 * Validates a target URL against SSRF and unsupported protocols.
 */
export function validateApiUrl(rawUrl: string): URL {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new ApiIngestionError('API endpoint URL cannot be empty.', 'EMPTY_URL');
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ApiIngestionError(`Invalid URL structure: "${trimmed}"`, 'INVALID_URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ApiIngestionError(
      `Unsupported protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.`,
      'INVALID_PROTOCOL'
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  // Guard against metadata service & private link-local SSRF vectors
  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
    throw new ApiIngestionError('Access to cloud metadata IP addresses is forbidden.', 'SSRF_BLOCKED');
  }

  return parsed;
}

/**
 * Traverses an arbitrary object to discover all distinct dot-separated field paths.
 */
export function extractFieldPaths(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') {
    return prefix ? [prefix] : [];
  }

  const paths: string[] = [];
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      paths.push(...extractFieldPaths(obj[0], prefix ? `${prefix}[]` : '[]'));
    }
    return paths;
  }

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object') {
      paths.push(...extractFieldPaths(value, fullPath));
    } else {
      paths.push(fullPath);
    }
  }

  return Array.from(new Set(paths));
}

/**
 * Normalizes raw parsed JSON into a consistent ApiRecord array and preserves structure.
 */
export function normalizeJsonResponse(rawData: unknown): { records: ApiRecord[]; fieldPaths: string[] } {
  let records: ApiRecord[] = [];

  if (Array.isArray(rawData)) {
    records = rawData.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        return {
          id: (item as any).id ?? (item as any)._id ?? idx + 1,
          ...item
        };
      }
      return { id: idx + 1, value: item };
    });
  } else if (typeof rawData === 'object' && rawData !== null) {
    const recordObj = rawData as Record<string, unknown>;
    // Check if there is an explicit array property (e.g., { data: [...], results: [...] })
    const candidateArrayKey = Object.keys(recordObj).find(
      key => Array.isArray(recordObj[key]) && (recordObj[key] as unknown[]).length > 0
    );

    if (candidateArrayKey) {
      const arr = recordObj[candidateArrayKey] as unknown[];
      records = arr.map((item, idx) => {
        if (typeof item === 'object' && item !== null) {
          return {
            id: (item as any).id ?? (item as any)._id ?? idx + 1,
            ...item
          };
        }
        return { id: idx + 1, value: item };
      });
    } else {
      // Single object API response (e.g., /posts/1)
      records = [{
        id: (recordObj as any).id ?? (recordObj as any)._id ?? 1,
        ...recordObj
      }];
    }
  } else {
    throw new ApiIngestionError('API response body is not a valid JSON object or array.', 'NON_JSON_STRUCTURE');
  }

  // Extract comprehensive field paths from all discovered records
  const allPaths = new Set<string>();
  records.slice(0, 15).forEach(rec => {
    extractFieldPaths(rec).forEach(p => allPaths.add(p));
  });

  return { records, fieldPaths: Array.from(allPaths) };
}

/**
 * Ingests live API data or loads verified sample datasets.
 * NEVER silently substitutes sample data on live fetch errors.
 */
export async function fetchApiData(
  targetUrl: string,
  options: ApiFetchOptions = {}
): Promise<ApiFetchResult> {
  const startTime = performance.now();
  const trimmedUrl = targetUrl.trim();

  // 1. Explicit or detected Demo Mode
  const matchedSample = SAMPLE_APIS.find(
    s => s.url.toLowerCase() === trimmedUrl.toLowerCase() ||
         (options.sampleId && s.id === options.sampleId) ||
         (options.mode === 'demo' && trimmedUrl.toLowerCase().includes(s.id)) ||
         trimmedUrl.toLowerCase() === s.id
  );

  if (options.mode === 'demo' || (matchedSample && trimmedUrl.includes('api.example.com'))) {
    if (!matchedSample) {
      throw new ApiIngestionError(`Demo dataset not found for: "${trimmedUrl}"`, 'DEMO_DATASET_NOT_FOUND', 404);
    }
    const data = matchedSample.sampleData;
    const rawJson = JSON.stringify(data, null, 2);
    const endTime = performance.now();
    const responseTimeMs = Math.max(1, Math.round(endTime - startTime));

    return calculateApiMetrics(
      data,
      rawJson,
      200,
      'OK (Demo Dataset)',
      responseTimeMs,
      matchedSample.url,
      'demo'
    );
  }

  // 2. Live API Mode
  const validatedUrl = validateApiUrl(trimmedUrl);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json, text/plain, */*',
      ...(options.headers || {})
    };

    const response = await fetch(validatedUrl.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const endTime = performance.now();
    const responseTimeMs = Math.max(1, Math.round(endTime - startTime));

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // Ignore secondary read error
      }
      throw new ApiIngestionError(
        `HTTP ${response.status} ${response.statusText || 'Error'}: ${errorBody.slice(0, 200)}`,
        'HTTP_ERROR',
        response.status
      );
    }

    // Check Content-Length header if present
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      throw new ApiIngestionError(
        `Response payload exceeds configured limit of ${maxSizeBytes} bytes (received ${contentLength} bytes).`,
        'PAYLOAD_TOO_LARGE',
        413
      );
    }

    const rawText = await response.text();
    const dataSize = new Blob([rawText]).size;
    if (dataSize > maxSizeBytes) {
      throw new ApiIngestionError(
        `Response size (${dataSize} bytes) exceeds limit of ${maxSizeBytes} bytes.`,
        'PAYLOAD_TOO_LARGE',
        413
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch (parseErr) {
      throw new ApiIngestionError(
        `Failed to parse response body as JSON: ${(parseErr as Error).message}`,
        'INVALID_JSON',
        response.status,
        parseErr
      );
    }

    const { records, fieldPaths } = normalizeJsonResponse(parsedJson);

    return calculateApiMetrics(
      records,
      rawText,
      response.status,
      response.statusText || 'OK',
      responseTimeMs,
      validatedUrl.toString(),
      'live',
      fieldPaths
    );

  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiIngestionError(
        `Request to ${validatedUrl.toString()} timed out after ${timeoutMs}ms.`,
        'TIMEOUT'
      );
    }

    if (error instanceof ApiIngestionError) {
      throw error;
    }

    // Surface real network/CORS error without masking or falling back
    const isCorsOrNetwork = error.name === 'TypeError' || error.message?.includes('Failed to fetch');
    const message = isCorsOrNetwork
      ? `Network or CORS error connecting to "${validatedUrl.toString()}". Verify that the remote server supports CORS or check your network connection.`
      : error.message || 'Unknown network error during API fetch.';

    throw new ApiIngestionError(message, 'NETWORK_ERROR', undefined, error);
  }
}

/**
 * Computes accurate structural telemetry metrics on normalized data.
 */
function calculateApiMetrics(
  data: ApiRecord[],
  rawJson: string,
  status: number,
  statusText: string,
  responseTimeMs: number,
  url: string,
  mode: 'live' | 'demo',
  fieldPaths?: string[]
): ApiFetchResult {
  const recordsCount = data.length;
  let fieldsCount = 0;
  let nestedFieldsCount = 0;
  let nullValuesCount = 0;

  if (data.length > 0) {
    const allUniqueFields = new Set<string>();
    data.forEach(item => {
      Object.entries(item).forEach(([k, val]) => {
        allUniqueFields.add(k);
        if (val === null || val === undefined) {
          nullValuesCount++;
        } else if (typeof val === 'object') {
          nestedFieldsCount++;
        }
      });
    });
    fieldsCount = allUniqueFields.size;
  }

  const dataSizeBytes = new Blob([rawJson]).size;
  const computedFieldPaths = fieldPaths && fieldPaths.length > 0
    ? fieldPaths
    : (data.length > 0 ? extractFieldPaths(data[0]) : []);

  return {
    url,
    mode,
    status,
    statusText,
    responseTimeMs,
    recordsCount,
    fieldsCount,
    nestedFieldsCount,
    nullValuesCount,
    dataSizeBytes,
    data,
    rawJson,
    fieldPaths: computedFieldPaths
  };
}
