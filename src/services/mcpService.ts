import type { McpToolCall } from '../types';

export function executeMcpTool(
  toolName: 'api.fetch()' | 'api.search()' | 'api.retrieve()',
  params: Record<string, any>
): Promise<McpToolCall> {
  const startTime = performance.now();
  const latency = Math.floor(30 + Math.random() * 50);

  return new Promise(resolve => {
    setTimeout(() => {
      const endTime = performance.now();
      resolve({
        tool: toolName,
        timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
        params,
        status: 'SUCCESS',
        resultCount: params.limit || 4,
        latencyMs: Math.round(endTime - startTime) + latency
      });
    }, latency);
  });
}
