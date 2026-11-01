import type { ApiRecord, ChatMessage, RagChunk, McpToolCall } from '../types';
import { executeMcpTool } from './mcpService';
import { searchVectorDatabase } from './vectorService';
import { getActiveLlmProvider } from './llm/llmProvider';
import { planFromNaturalLanguage, executePlan } from './operationPlanner';

export async function processAiQuery(
  userQuery: string,
  allRecords: ApiRecord[],
  allChunks: RagChunk[],
  onStepUpdate?: (step: string) => void
): Promise<{ message: ChatMessage; retrievedChunks: RagChunk[] }> {
  onStepUpdate?.("Analyzing query intent & generating operation AST...");

  const plan = planFromNaturalLanguage(userQuery);
  let activeToolCall: McpToolCall | undefined;
  let retrievedChunks: RagChunk[] = [];

  if (plan.intent === 'filter' && plan.operations[0].type === 'filter') {
    const fOp = plan.operations[0];
    onStepUpdate?.(`MCP: api.filter(${fOp.field} ${fOp.operator} ${fOp.value})`);
    
    activeToolCall = await executeMcpTool('api.filter()', {
      field: fOp.field,
      operator: fOp.operator,
      value: String(fOp.value)
    });

    if (activeToolCall.status === 'SUCCESS' && Array.isArray(activeToolCall.data)) {
      const matchedRecs = activeToolCall.data;
      retrievedChunks = matchedRecs.map((rec: any, idx: number) => ({
        id: rec.chunkId || rec.id,
        chunkNumber: idx + 1,
        similarity: 1.0,
        sourceId: rec.sourceId,
        sourceUrl: rec.sourceUrl,
        recordId: rec.recordId,
        recordTitle: rec.metadata?.title || `Record #${rec.recordId}`,
        category: rec.metadata?.category,
        price: rec.metadata?.price,
        content: rec.content,
        fieldPaths: rec.fieldPaths || [],
        chunkIndex: idx,
        contentHash: rec.contentHash || '',
        metadata: rec.metadata || {}
      }));
    }
  } else if (plan.intent === 'retrieve' && plan.operations[0].type === 'retrieve') {
    const rOp = plan.operations[0];
    onStepUpdate?.(`MCP: api.retrieve(id: ${rOp.recordId})`);
    activeToolCall = await executeMcpTool('api.retrieve()', {
      recordId: rOp.recordId
    });

    if (activeToolCall.status === 'SUCCESS' && Array.isArray(activeToolCall.data)) {
      retrievedChunks = activeToolCall.data.map((rec: any, idx: number) => ({
        id: rec.chunkId || rec.id,
        chunkNumber: idx + 1,
        similarity: 1.0,
        sourceId: rec.sourceId,
        sourceUrl: rec.sourceUrl,
        recordId: rec.recordId,
        recordTitle: rec.metadata?.title || `Record #${rec.recordId}`,
        category: rec.metadata?.category,
        price: rec.metadata?.price,
        content: rec.content,
        fieldPaths: rec.fieldPaths || [],
        chunkIndex: idx,
        contentHash: rec.contentHash || '',
        metadata: rec.metadata || {}
      }));
    }
  } else {
    // Default semantic search
    onStepUpdate?.("MCP: api.search()");
    activeToolCall = await executeMcpTool('api.search()', {
      query: userQuery,
      limit: 5,
      threshold: 0.1
    });

    if (activeToolCall.status === 'SUCCESS' && Array.isArray(activeToolCall.data) && activeToolCall.data.length > 0) {
      retrievedChunks = activeToolCall.data;
    } else {
      // Fallback search against in-memory chunk list if vector store has not populated yet
      retrievedChunks = await searchVectorDatabase(userQuery, allChunks, 0.1, 5);
    }
  }

  // If MCP tool returned empty for filter/retrieve, check in-memory chunks as fallback
  if (retrievedChunks.length === 0 && allChunks.length > 0) {
    retrievedChunks = await searchVectorDatabase(userQuery, allChunks, 0.1, 5);
  }

  onStepUpdate?.("Synthesizing grounded answer with active LLM provider...");
  const llm = getActiveLlmProvider();
  const llmResult = await llm.generateAnswer({
    userQuery,
    contextChunks: retrievedChunks,
    allRecords
  });

  const sources: ChatMessage['sources'] = retrievedChunks.slice(0, 4).map(c => ({
    id: c.recordId,
    name: c.recordTitle || `Record #${c.recordId}`,
    price: c.price,
    category: c.category,
    snippet: c.content.slice(0, 160) + (c.content.length > 160 ? '...' : ''),
    fieldPaths: c.fieldPaths
  }));

  const message: ChatMessage = {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    text: llmResult.text,
    mcpToolCall: activeToolCall,
    ragChunks: retrievedChunks,
    sources
  };

  return { message, retrievedChunks };
}
