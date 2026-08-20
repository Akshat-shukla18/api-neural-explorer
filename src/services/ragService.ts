import type { ApiRecord, ChatMessage, RagChunk } from '../types';
import { executeMcpTool } from './mcpService';
import { searchVectorDatabase } from './vectorService';

export async function processAiQuery(
  userQuery: string,
  allRecords: ApiRecord[],
  allChunks: RagChunk[],
  onStepUpdate?: (step: string) => void
): Promise<{ message: ChatMessage; retrievedChunks: RagChunk[] }> {
  onStepUpdate?.("Searching API knowledge...");
  await new Promise(r => setTimeout(r, 250));

  onStepUpdate?.("MCP: api.search()");
  const mcpResult = await executeMcpTool('api.search()', { query: userQuery, limit: 4 });

  onStepUpdate?.("Retrieving relevant chunks...");
  const retrievedChunks = searchVectorDatabase(userQuery, allChunks);
  await new Promise(r => setTimeout(r, 300));

  onStepUpdate?.("Building RAG context...");
  await new Promise(r => setTimeout(r, 200));

  onStepUpdate?.("Generating answer...");
  await new Promise(r => setTimeout(r, 250));

  const queryLower = userQuery.toLowerCase();
  let answerText = "";
  const sources: ChatMessage['sources'] = [];

  if (queryLower.includes('10000') || queryLower.includes('10,000') || queryLower.includes('cost') || queryLower.includes('price')) {
    const expensiveProducts = allRecords.filter(r => (r.price || r.amount) && (r.price || r.amount) > 10000);
    if (expensiveProducts.length > 0) {
      answerText = `Based on the connected API, ${expensiveProducts.length} items have a price above ₹10,000.`;
      expensiveProducts.forEach(p => {
        sources.push({
          id: p.id,
          name: p.name || p.title || `Item #${p.id}`,
          price: p.price || p.amount,
          category: p.category || p.department || p.type,
          snippet: p.description || `Price: ₹${(p.price || p.amount)?.toLocaleString()}`
        });
      });
    } else {
      answerText = `Based on the connected API vector index, no items exceeded ₹10,000 in price.`;
    }
  } else if (queryLower.includes('shoe') || queryLower.includes('nike') || queryLower.includes('adidas')) {
    const shoeProducts = allRecords.filter(r => 
      (r.category && r.category.toLowerCase().includes('shoe')) ||
      (r.brand && r.brand.toLowerCase().includes('nike')) ||
      (r.brand && r.brand.toLowerCase().includes('adidas')) ||
      (r.name && r.name.toLowerCase().includes('shoe'))
    );
    answerText = `Found ${shoeProducts.length || retrievedChunks.length} matching footwear products in the vector store with high similarity.`;
    (shoeProducts.length > 0 ? shoeProducts : allRecords.slice(0, 3)).forEach(p => {
      sources.push({
        id: p.id,
        name: p.name || p.title || `Item #${p.id}`,
        price: p.price || p.amount,
        category: p.category,
        snippet: p.description || `Category: ${p.category}`
      });
    });
  } else if (queryLower.includes('user') || queryLower.includes('role') || queryLower.includes('engineer') || queryLower.includes('team')) {
    answerText = `The API directory lists active system engineers and platform leads.`;
    allRecords.slice(0, 3).forEach(u => {
      sources.push({
        id: u.id,
        name: u.name || `User #${u.id}`,
        category: u.department || u.role,
        snippet: `${u.role || 'Member'} • ${u.location || u.status}`
      });
    });
  } else {
    const topChunk = retrievedChunks[0];
    answerText = `Retrieved ${retrievedChunks.length} matching context chunks from the vector database (top similarity: ${(topChunk?.similarity || 0.91)}). Key finding: ${topChunk?.recordTitle || 'Record'} contains matching attributes.`;
    
    retrievedChunks.slice(0, 3).forEach(c => {
      sources.push({
        id: c.recordId,
        name: c.recordTitle,
        price: c.price,
        category: c.category,
        snippet: c.content.slice(0, 70) + '...'
      });
    });
  }

  const message: ChatMessage = {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    text: answerText,
    mcpToolCall: mcpResult,
    ragChunks: retrievedChunks,
    sources
  };

  return { message, retrievedChunks };
}
