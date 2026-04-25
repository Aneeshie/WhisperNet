import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { assembleChunks } from "@/utils/qrChunker";

export function Scanner({ onScan }: { onScan: (text: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  // Accumulator State
  const accumulatedChunks = useRef<Record<number, string>>({});
  const expectedTotal = useRef<number | null>(null);
  const [progress, setProgress] = useState<{ scanned: number, total: number } | null>(null);

  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let hasCompleted = false;
    const html5Qrcode = new Html5Qrcode("qr-reader-container", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false
    });
    scannerRef.current = html5Qrcode;

    const startScanner = async () => {
      try {
        await html5Qrcode.start(
          { facingMode: "environment" },
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0 
          },
          (decodedText) => {
            if (hasCompleted) return;
            
            const match = decodedText.match(/^\[(\d+)\/(\d+)\](.*)/);
            
            if (match) {
              const index = parseInt(match[1], 10);
              const total = parseInt(match[2], 10);
              
              if (expectedTotal.current !== null && expectedTotal.current !== total) {
                accumulatedChunks.current = {};
                setProgress(null);
              }
              
              expectedTotal.current = total;
              accumulatedChunks.current[index] = decodedText; // store raw chunk with header for assembleChunks

              const scannedCount = Object.keys(accumulatedChunks.current).length;
              setProgress({ scanned: scannedCount, total });

              if (scannedCount === total) {
                hasCompleted = true;
                
                try {
                  const fullPayload = assembleChunks(Object.values(accumulatedChunks.current));
                  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                  onScanRef.current(fullPayload);
                } catch (e) {
                  console.error("Failed to assemble chunks", e);
                  // Reset and retry if failed
                  accumulatedChunks.current = {};
                  setProgress(null);
                  hasCompleted = false;
                  return;
                }
                
                if (scannerRef.current && scannerRef.current.isScanning) {
                  scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                  }).catch(console.error);
                }
              }
            } else {
              // Not a chunked payload, just a regular QR string
              hasCompleted = true;
              if (navigator.vibrate) navigator.vibrate([200]);
              onScanRef.current(decodedText);
              
              if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                  scannerRef.current?.clear();
                }).catch(console.error);
              }
            }
          },
          () => {} // ignore frame errors
        );
      } catch (err) {
        console.error("Error starting scanner", err);
      }
    };

    startScanner();

    return () => {
      hasCompleted = true; // Prevent any late scans during unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(console.error);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      <div className="relative w-80 h-80 rounded-xl overflow-hidden bg-black border-2 border-zinc-800 flex items-center justify-center shadow-lg shadow-black/50">
        <div id="qr-reader-container" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:!min-w-0 [&_video]:!min-h-0" />
        <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none z-10" />
        <div className="absolute inset-x-8 inset-y-8 border-2 border-red-500/50 rounded pointer-events-none z-10" />
        <div className="absolute top-1/2 left-4 w-4 h-0.5 bg-red-500/50 pointer-events-none z-10" />
        <div className="absolute top-1/2 right-4 w-4 h-0.5 bg-red-500/50 pointer-events-none z-10" />
        <div className="absolute top-4 left-1/2 w-0.5 h-4 bg-red-500/50 pointer-events-none z-10" />
        <div className="absolute bottom-4 left-1/2 w-0.5 h-4 bg-red-500/50 pointer-events-none z-10" />
      </div>
      
      {progress && progress.total > 1 ? (
        <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 p-3 rounded-md text-center shadow-lg animate-in fade-in">
          <p className="text-xs font-mono text-amber-500 tracking-widest mb-2 uppercase font-bold">
            Captured {progress.scanned} of {progress.total}...
          </p>
          <div className="w-full h-1.5 bg-zinc-950 rounded overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
              style={{ width: `${(progress.scanned / progress.total) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="text-center space-y-2 mt-2">
          <p className="text-xs font-mono text-red-500 animate-pulse font-bold tracking-widest">AWAITING OPTICAL DATA...</p>
          <p className="text-[10px] font-mono text-zinc-500 max-w-xs mx-auto">
            Align the target QR code within the viewfinder.
          </p>
        </div>
      )}
    </div>
  );
}
