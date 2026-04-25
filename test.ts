import { splitPayload } from "./src/utils/qrChunker";

const payload = "a".repeat(1000);
const chunks = splitPayload(payload, 200);

console.log("Chunks length:", chunks.length);
console.log("Chunk 0 length:", chunks[0].length);
console.log("Chunk 0:", chunks[0].substring(0, 50));
