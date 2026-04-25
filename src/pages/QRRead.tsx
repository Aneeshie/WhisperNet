import { useState } from "react";
import { toast } from "sonner";
import { importBundle } from "@/qr/importBundle";
import { useUIStore } from "@/store";
import { Scanner } from "@/components/Scanner";

export default function QRRead() {
  const [scannedPayload, setScannedPayload] = useState<string | null>(null);
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
            onClick={() => setScannedPayload(null)}
            className="w-full py-3 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-300 active:bg-zinc-800 transition-colors"
          >
            RESET_SCANNER
          </button>
        </div>
      ) : (
        <Scanner onScan={handleScan} />
      )}
    </div>
  );
}
