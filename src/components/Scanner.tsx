import { useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

export function Scanner({ onScan }: { onScan: (text: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0 
          },
          (decodedText) => {
            if (hasScanned) return;
            hasScanned = true; // Lock immediately to prevent double fires
            
            onScan(decodedText);
            
            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current.stop().then(() => {
                scannerRef.current?.clear();
              }).catch(console.error);
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
      hasScanned = true; // Prevent any late scans during unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(console.error);
      }
    };
  }, [onScan]);

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
      <div className="text-center space-y-2 mt-4">
        <p className="text-xs font-mono text-red-500 animate-pulse">AWAITING_OPTICAL_DATA...</p>
        <p className="text-[10px] font-mono text-zinc-600 max-w-xs mx-auto">
          Align the target QR code within the viewfinder. The hardware will automatically capture and decode the payload.
        </p>
      </div>
    </>
  );
}
