import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { exportBundle } from "@/qr/exportBundle";
import { chunkPayload } from "@/qr/chunker";

export default function QRGen() {
  const [qrUrls, setQrUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function generatePayload() {
      try {
        const payloadString = await exportBundle();
        if (!isMounted) return;

        const chunks = chunkPayload(payloadString, 250); // 250 chars guarantees extremely low density

        const urls = await Promise.all(
          chunks.map((chunk) => {
            return new Promise<string>((resolve, reject) => {
              QRCode.toDataURL(
                chunk,
                {
                  width: 800,
                  margin: 2,
                  color: {
                    dark: "#ffffff",
                    light: "#09090b",
                  },
                  errorCorrectionLevel: "L",
                },
                (err, url) => {
                  if (err) reject(err);
                  else resolve(url);
                }
              );
            });
          })
        );

        if (isMounted) {
          setQrUrls(urls);
          setIsGenerating(false);
        }
      } catch (error) {
        console.error("Payload Export Error", error);
        toast.error("Failed to export mesh bundle");
        if (isMounted) setIsGenerating(false);
      }
    }

    generatePayload();

    return () => {
      isMounted = false;
    };
  }, []);

  // Animation Loop
  useEffect(() => {
    if (qrUrls.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % qrUrls.length);
    }, 600); // 600ms per frame
    
    return () => clearInterval(interval);
  }, [qrUrls]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8">
      <div className="w-72 h-72 border-2 border-dashed border-zinc-700 rounded-xl flex items-center justify-center bg-zinc-950 p-2 overflow-hidden relative shadow-lg shadow-black/50">
        {isGenerating ? (
          <p className="text-xs font-mono text-zinc-500 animate-pulse">GENERATING CHUNKS...</p>
        ) : qrUrls.length > 0 ? (
          <img 
            src={qrUrls[currentIndex]} 
            alt={`QR Chunk ${currentIndex + 1}`} 
            className="w-full h-full object-contain"
          />
        ) : (
          <p className="text-xs font-mono text-red-500">GENERATION FAILED</p>
        )}
      </div>
      
      <div className="text-center space-y-2">
        {qrUrls.length > 1 ? (
          <p className="text-sm font-mono text-amber-500">
            FLASHING CHUNK [{currentIndex + 1}/{qrUrls.length}]
          </p>
        ) : qrUrls.length === 1 ? (
          <p className="text-xs font-mono text-zinc-400">PAYLOAD STATUS: READY</p>
        ) : null}
        
        <p className="text-[10px] font-mono text-zinc-600 max-w-xs mx-auto">
          Present this animated optical pattern to another node to propagate local mesh state.
        </p>
      </div>
    </div>
  );
}
