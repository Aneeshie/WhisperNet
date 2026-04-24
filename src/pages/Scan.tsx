import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "sonner";

import { exportBundle } from "@/qr/exportBundle";
import { importBundle } from "@/qr/importBundle";

export default function Scan() {
  const [qrImage, setQrImage] = useState("");
  const [scanning, setScanning] = useState(false);

  const startedRef = useRef(false);

  useEffect(() => {
    if (!scanning || startedRef.current) return;

    startedRef.current = true;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 220 },
      false,
    );

    scanner.render(
      async (decodedText) => {
        try {
          const count = await importBundle(decodedText);
          toast.success(`Imported ${count} messages`);
          await scanner.clear();
          setScanning(false);
          startedRef.current = false;
        } catch {
          toast.error("Invalid QR bundle");
        }
      },
      () => {},
    );

    return () => {
      scanner.clear().catch(() => {});
      startedRef.current = false;
    };
  }, [scanning]);

  async function handleShare() {
    try {
      const payload = await exportBundle();
      const url = await QRCode.toDataURL(payload);
      setQrImage(url);
      toast.success("QR bundle generated");
    } catch {
      toast.error("Failed to generate QR");
    }
  }

  function handleScan() {
    setQrImage("");
    setScanning(true);
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <header className="py-4 border-b border-zinc-900">
        <h1 className="text-xl font-bold tracking-tight">QR Drop & Scan</h1>
        <p className="text-xs font-mono text-zinc-500 mt-1">
          OPTICAL_LINK: READY
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="w-64 h-64 border-2 border-dashed border-zinc-700 rounded-xl flex items-center justify-center bg-zinc-950 overflow-hidden">
          {qrImage ? (
            <img src={qrImage} alt="QR Bundle" className="w-full h-full" />
          ) : scanning ? (
            <div id="reader" className="w-full h-full" />
          ) : (
            <p className="text-xs font-mono text-zinc-500">
              CAMERA_FEED_PLACEHOLDER
            </p>
          )}
        </div>

        <div className="flex space-x-4 w-full max-w-xs">
          <button
            onClick={handleScan}
            className="flex-1 py-3 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-300 active:bg-zinc-800 transition-colors"
          >
            SCAN
          </button>

          <button
            onClick={handleShare}
            className="flex-1 py-3 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-300 active:bg-zinc-800 transition-colors"
          >
            SHARE
          </button>
        </div>
      </div>
    </div>
  );
}
