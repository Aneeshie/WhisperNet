export function splitPayload(payload: string, maxChunkSize: number = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < payload.length) {
    chunks.push(payload.substring(i, i + maxChunkSize));
    i += maxChunkSize;
  }
  
  const total = chunks.length;
  // Format: [1/3]...data...
  return chunks.map((chunk, index) => `[${index + 1}/${total}]${chunk}`);
}

export function assembleChunks(chunks: string[]): string {
  if (!chunks || chunks.length === 0) return "";
  
  const parsedChunks = chunks.map((c) => {
    const match = c.match(/^\[(\d+)\/(\d+)\](.*)/);
    if (!match) throw new Error("Invalid chunk format");
    return {
      index: parseInt(match[1], 10),
      total: parseInt(match[2], 10),
      data: match[3]
    };
  });

  if (parsedChunks.length === 0) return "";
  
  const total = parsedChunks[0].total;
  
  if (parsedChunks.length !== total) {
    throw new Error(`Missing chunks. Expected ${total}, got ${parsedChunks.length}`);
  }

  // Sort chunks strictly by index (1-based)
  parsedChunks.sort((a, b) => a.index - b.index);

  // Verification step
  for (let i = 0; i < total; i++) {
    if (parsedChunks[i].index !== i + 1) {
      throw new Error(`Missing chunk sequence at index ${i + 1}`);
    }
    if (parsedChunks[i].total !== total) {
      throw new Error("Mismatched total chunks count");
    }
  }

  // Combine
  return parsedChunks.map(p => p.data).join("");
}
