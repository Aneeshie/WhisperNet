export function chunkPayload(payload: string, maxChunkSize: number = 300): string[] {
  const totalChunks = Math.ceil(payload.length / maxChunkSize);
  
  if (totalChunks <= 1) {
    return [`[1/1]${payload}`];
  }

  const chunks: string[] = [];
  for (let i = 0; i < totalChunks; i++) {
    const chunkData = payload.substring(i * maxChunkSize, (i + 1) * maxChunkSize);
    // [1/3] format -> 1-indexed for the header
    chunks.push(`[${i + 1}/${totalChunks}]${chunkData}`);
  }

  return chunks;
}
