import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchApiData,
  validateApiUrl,
  normalizeJsonResponse,
  extractFieldPaths,
  ApiIngestionError,
  SAMPLE_PRODUCTS_DATA
} from '../src/services/apiService';

describe('ApiService - URL Validation & SSRF Prevention', () => {
  it('accepts valid HTTP and HTTPS URLs', () => {
    expect(() => validateApiUrl('https://jsonplaceholder.typicode.com/posts')).not.toThrow();
    expect(() => validateApiUrl('http://example.com/api/v1/data')).not.toThrow();
  });

  it('rejects empty or whitespace URLs', () => {
    expect(() => validateApiUrl('')).toThrow(ApiIngestionError);
    expect(() => validateApiUrl('   ')).toThrow(ApiIngestionError);
  });

  it('rejects unsupported protocols (ftp, file, javascript)', () => {
    expect(() => validateApiUrl('ftp://example.com/data.json')).toThrow(/Unsupported protocol/);
    expect(() => validateApiUrl('file:///etc/passwd')).toThrow(/Unsupported protocol/);
    expect(() => validateApiUrl('javascript:alert(1)')).toThrow();
  });

  it('blocks cloud metadata IP SSRF vectors', () => {
    expect(() => validateApiUrl('http://169.254.169.254/latest/meta-data')).toThrow(/metadata IP/);
    expect(() => validateApiUrl('http://metadata.google.internal/computeMetadata/v1')).toThrow(/metadata/);
  });
});

describe('ApiService - JSON Normalization', () => {
  it('normalizes a standard JSON array', () => {
    const raw = [
      { id: 10, title: 'First Post', body: 'Post content' },
      { id: 20, title: 'Second Post', body: 'Another post' }
    ];
    const { records, fieldPaths } = normalizeJsonResponse(raw);
    expect(records).toHaveLength(2);
    expect(records[0].id).toBe(10);
    expect(records[1].id).toBe(20);
    expect(fieldPaths).toContain('title');
    expect(fieldPaths).toContain('body');
  });

  it('normalizes an object containing a data array', () => {
    const raw = {
      status: 'success',
      total: 2,
      data: [
        { id: 'a', name: 'Item A', meta: { count: 5 } },
        { id: 'b', name: 'Item B', meta: { count: 8 } }
      ]
    };
    const { records, fieldPaths } = normalizeJsonResponse(raw);
    expect(records).toHaveLength(2);
    expect(records[0].name).toBe('Item A');
    expect(fieldPaths).toContain('meta.count');
  });

  it('normalizes a single object response', () => {
    const raw = { id: 42, username: 'octocat', email: 'octo@github.com' };
    const { records } = normalizeJsonResponse(raw);
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe(42);
    expect(records[0].username).toBe('octocat');
  });

  it('extracts nested field paths accurately', () => {
    const obj = {
      user: {
        profile: {
          address: {
            city: 'Berlin'
          }
        }
      },
      tags: ['ai', 'nlp']
    };
    const paths = extractFieldPaths(obj);
    expect(paths).toContain('user.profile.address.city');
  });
});

describe('ApiService - Ingestion & Error Safety', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads demo datasets explicitly without fabricating live responses', async () => {
    const result = await fetchApiData('https://api.example.com/products', { mode: 'demo' });
    expect(result.mode).toBe('demo');
    expect(result.status).toBe(200);
    expect(result.recordsCount).toBe(SAMPLE_PRODUCTS_DATA.length);
    expect(result.data[0].name).toBe(SAMPLE_PRODUCTS_DATA[0].name);
  });

  it('fails honestly on HTTP error and never substitutes sample products', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
      text: vi.fn().mockResolvedValue('Resource not found')
    };

    global.fetch = vi.fn().mockResolvedValue(mockResponse as any);

    await expect(
      fetchApiData('https://api.remote-service.com/missing-endpoint')
    ).rejects.toThrow(ApiIngestionError);

    try {
      await fetchApiData('https://api.remote-service.com/missing-endpoint');
    } catch (err: any) {
      expect(err.status).toBe(404);
      expect(err.code).toBe('HTTP_ERROR');
    }
  });

  it('fails honestly on invalid JSON response and does not fake 200 OK', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      text: vi.fn().mockResolvedValue('<html><body>Bad Gateway 502</body></html>')
    };

    global.fetch = vi.fn().mockResolvedValue(mockResponse as any);

    await expect(
      fetchApiData('https://api.remote-service.com/invalid-json')
    ).rejects.toThrow(ApiIngestionError);

    try {
      await fetchApiData('https://api.remote-service.com/invalid-json');
    } catch (err: any) {
      expect(err.code).toBe('INVALID_JSON');
    }
  });

  it('fails honestly on network/CORS error and does not silently fall back to sample products', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(
      fetchApiData('https://cors-restricted-api.com/items')
    ).rejects.toThrow(/Network or CORS error/);
  });
});

