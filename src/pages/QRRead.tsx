import { useRef, useState } from "react";
import { toast } from "sonner";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useEffect } from "react";
import { importBundle } from "@/qr/importBundle";
import { useUIStore } from "@/store";

function ScannerComponent({ onScan, onChunkScan }: { onScan: (text: string) => void, onChunkScan: (scanned: number, total: number) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const accumulatedChunks = useRef<Record<number, string>>({});
  const expectedTotal = useRef<number>(1);

  useEffect(() => {
    let hasScanned = false;
    const html5Qrcode = new Html5Qrcode("qr-reader-container", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false
    });
    scannerRef.current = html5Qrcode;

    const startScanner = async () => {
      try {
        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, aspectRatio: 1.0 },
          (decodedText) => {
            if (hasScanned) return;

            const match = decodedText.match(/^\[(\d+)\/(\d+)\](.*)/);
            if (match) {
              const index = parseInt(match[1], 10);
              const total = parseInt(match[2], 10);
              const data = match[3];

              expectedTotal.current = total;
              accumulatedChunks.current[index] = data;

              const scannedCount = Object.keys(accumulatedChunks.current).length;
              onChunkScan(scannedCount, total);

              if (scannedCount === total) {
                hasScanned = true; // Lock
                let fullPayload = "";
                for (let i = 1; i <= total; i++) {
                  fullPayload += accumulatedChunks.current[i];
                }

                onScan(fullPayload);

                if (scannerRef.current && scannerRef.current.isScanning) {
                  scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                  }).catch(console.error);
                }
              }
            } else {
              // Backward compatibility for unchunked payloads
              hasScanned = true; // Lock immediately to prevent double fires
              onScan(decodedText);

              if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                  scannerRef.current?.clear();
                }).catch(console.error);
              }
            }
          },
          () => { } // ignore frame errors
        );
      } catch (err) {
        console.error("Error starting scanner", err);
      }
    };

    startScanner();

    return () => {
      hasScanned = true; // Prevent any late scans during unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(console.error);
      }
    };
  }, [onScan, onChunkScan]);

  return (
    <>
      <div className="relative w-72 h-72 rounded-xl overflow-hidden bg-black border-2 border-zinc-800 flex items-center justify-center shadow-lg shadow-black/50">
        <div id="qr-reader-container" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:!min-w-0 [&_video]:!min-h-0" />
        <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none z-10" />
        <div className="absolute inset-x-8 inset-y-8 border-2 border-red-500/50 rounded pointer-events-none z-10" />
        <div className="absolute top-1/2 left-4 w-4 h-0.5 bg-red-500/50 pointer-events-none z-10" />
        <div className="absolute top-1/2 right-4 w-4 h-0.5 bg-red-500/50 pointer-events-none z-10" />
        <div className="absolute top-4 left-1/2 w-0.5 h-4 bg-red-500/50 pointer-events-none z-10" />
        <div className="absolute bottom-4 left-1/2 w-0.5 h-4 bg-red-500/50 pointer-events-none z-10" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-xs font-mono text-red-500 animate-pulse">AWAITING_OPTICAL_DATA...</p>
        <p className="text-[10px] font-mono text-zinc-600 max-w-xs mx-auto">
          Align the target QR code within the viewfinder. The hardware will automatically capture and decode the payload.
        </p>
      </div>
    </>
  );
}

export default function QRRead() {
  const [scannedPayload, setScannedPayload] = useState<string | null>(null);
  const [chunkProgress, setChunkProgress] = useState<{ scanned: number, total: number } | null>(null);
  const { fetchMessages } = useUIStore();

  const handleScan = async (text: string) => {
    setScannedPayload(text);
    try {
      const count = await importBundle(text);
      await fetchMessages();
      toast.success(`Imported ${count} messages via Optical Link`);
    } catch (error) {
      console.error("Import Error", error);
      toast.error("Invalid or corrupted QR payload");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start space-y-6 pt-4">
      {scannedPayload ? (
        <div className="w-full flex flex-col space-y-4">
          <div className="bg-green-950/20 border border-green-900/50 p-4 rounded-md">
            <h2 className="text-sm font-mono text-green-500 mb-2">RAW_PAYLOAD_RECEIVED</h2>
            <p className="text-xs font-mono text-zinc-300 break-all max-h-48 overflow-y-auto">
              {scannedPayload}
            </p>
          </div>
          <button
            onClick={() => {
              setScannedPayload(null);
              setChunkProgress(null);
            }}
            className="w-full py-3 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-300 active:bg-zinc-800 transition-colors"
          >
            RESET_SCANNER
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <ScannerComponent onScan={handleScan} onChunkScan={(scanned, total) => setChunkProgress({ scanned, total })} />
          {chunkProgress && chunkProgress.total > 1 && (
            <div className="w-full bg-zinc-900/80 border border-zinc-800 p-3 rounded-md text-center shadow-lg animate-in fade-in slide-in-from-bottom-2">
              <p className="text-xs font-mono text-amber-500 tracking-widest mb-2">
                COLLECTING CHUNKS: {chunkProgress.scanned} / {chunkProgress.total}
              </p>
              <div className="w-full h-1.5 bg-zinc-950 rounded overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  style={{ width: `${(chunkProgress.scanned / chunkProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
