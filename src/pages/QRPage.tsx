import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Html5QrcodeScanner } from "html5-qrcode";

import { exportBundle } from "../qr/exportBundle";
import { importBundle } from "../qr/importBundle";

export default function QRPage() {
  const [qrImage, setQrImage] = useState("");
  const [status, setStatus] = useState("");

  const scannerRef = useRef(false);

  async function handleGenerate() {
    const payload = await exportBundle();
    const url = await QRCode.toDataURL(payload);
    setQrImage(url);
  }

  useEffect(() => {
    if (scannerRef.current) return;
    scannerRef.current = true;

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false,
    );

    scanner.render(
      async (decodedText) => {
        try {
          const count = await importBundle(decodedText);
          setStatus(`Imported ${count} messages`);
          await scanner.clear();
        } catch {
          setStatus("Invalid QR bundle");
        }
      },
      () => {},
    );
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">QR Sync</h1>

      <button
        onClick={handleGenerate}
        className="px-4 py-2 rounded bg-black text-white"
      >
        Export to QR
      </button>

      {qrImage && (
        <img src={qrImage} alt="QR Code" className="w-64 h-64 border" />
      )}

      <div id="reader" className="mt-4" />

      {status && <p>{status}</p>}
    </div>
  );
}
