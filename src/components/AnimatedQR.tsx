import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { splitPayload } from "@/utils/qrChunker";

interface AnimatedQRProps {
  payload: string;
}

export function AnimatedQR({ payload }: AnimatedQRProps) {
  const [qrUrls, setQrUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function generate() {
      if (!payload) return;
      
      const chunks = splitPayload(payload, 50); // Drastically reduced density
      
      try {
        const urls = await Promise.all(
          chunks.map((chunk) => {
            return new Promise<string>((resolve, reject) => {
              QRCode.toDataURL(
                chunk,
                { 
                  width: 800, 
                  margin: 2, 
                  color: { dark: "#ffffff", light: "#000000" }, 
                  errorCorrectionLevel: "M" 
                },
                (err, url) => {
                  if (err) reject(err);
                  else resolve(url);
                }
              );
            });
          })
        );
        
        if (isMounted) setQrUrls(urls);
      } catch (err) {
        console.error("Failed to generate QR chunks", err);
      }
    }

    generate();

    return () => {
      isMounted = false;
    };
  }, [payload]);

  // Animation Loop
  useEffect(() => {
    if (qrUrls.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % qrUrls.length);
    }, 600);
    
    return () => clearInterval(interval);
  }, [qrUrls]);

  if (!payload || qrUrls.length === 0) {
    return (
      <div className="w-80 h-80 bg-zinc-900 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-700 p-2">
        <p className="text-xs font-mono text-zinc-500 animate-pulse">GENERATING CHUNKS...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      <div className="w-80 h-80 bg-zinc-900 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-700 p-2 overflow-hidden shadow-lg shadow-black/50">
        <img 
          src={qrUrls[currentIndex]} 
          alt="Animated QR Payload" 
          className="w-full h-full object-contain" 
          style={{ imageRendering: "pixelated" }} 
        />
      </div>
      
      <div className="text-center w-full h-8 flex items-center justify-center">
        {qrUrls.length > 1 ? (
          <p className="text-xs font-mono text-amber-500 animate-pulse tracking-widest uppercase font-bold">
            Flashing frame {currentIndex + 1} of {qrUrls.length}... Keep steady
          </p>
        ) : (
          <p className="text-xs font-mono text-zinc-400 tracking-widest uppercase font-bold">PAYLOAD STATUS: READY</p>
        )}
      </div>
    </div>
  );
}
