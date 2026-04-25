import LZString from "lz-string";

function test() {
  const b64 = "SomeBase64String123+==";
  const compressed = LZString.compressToBase64("ENC:" + b64);
  const decompressed = LZString.decompressFromBase64(compressed);
  console.log("compressed length", compressed.length);
  console.log("decompressed", decompressed);
}
test();
