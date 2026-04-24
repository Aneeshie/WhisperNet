import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { exportBundle } from "@/qr/exportBundle";

export default function QRGen() {
  const [qrSrc, setQrSrc] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function generatePayload() {
      try {
        const payloadString = await exportBundle();
        if (!isMounted) return;

        QRCode.toDataURL(
          payloadString,
          {
            width: 800,
            margin: 2,
            color: {
              dark: "#ffffff", // white squares
              light: "#09090b", // zinc-950 background
            },
            errorCorrectionLevel: "L",
          },
          (err, url) => {
            if (err) {
              console.error("QR Generation Error", err);
              toast.error("Failed to generate optical pattern");
              return;
            }
            if (isMounted) setQrSrc(url);
          }
        );
      } catch (error) {
        console.error("Payload Export Error", error);
        toast.error("Failed to export mesh bundle");
      }
    }

    generatePayload();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8">
      <div className="w-72 h-72 border-2 border-dashed border-zinc-700 rounded-xl flex items-center justify-center bg-zinc-950 p-2 overflow-hidden">
        {qrSrc ? (
          <img src={qrSrc} alt="Generated QR Code" className="w-full h-full object-contain" />
        ) : (
          <p className="text-xs font-mono text-zinc-500">GENERATING...</p>
        )}
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-xs font-mono text-zinc-400">PAYLOAD STATUS: READY</p>
        <p className="text-[10px] font-mono text-zinc-600 max-w-xs mx-auto">
          Present this optical pattern to another node to propagate local mesh state.
        </p>
      </div>
    </div>
  );
}
