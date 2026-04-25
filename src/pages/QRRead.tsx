import { useState } from "react";
import { toast } from "sonner";
import { importBundle } from "@/qr/importBundle";
import { useMessageStore } from "@/store";
import { Scanner } from "@/components/Scanner";
import { CheckCircle } from "lucide-react";

export default function QRRead() {
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const fetchMessages = useMessageStore(state => state.fetchMessages);

  const handleScan = async (text: string) => {
    try {
      const count = await importBundle(text);
      await fetchMessages();
      setImportedCount(count);
      toast.success(`Received ${count} messages`);
    } catch (error) {
      console.error("Import Error", error);
      toast.error("Invalid or corrupted QR code");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start space-y-6 pt-2">
      {importedCount !== null ? (
        <div className="w-full flex flex-col items-center space-y-5 py-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center glow-green">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-emerald-300">Messages Received!</h2>
            <p className="text-sm text-zinc-400 mt-1">
              {importedCount} message{importedCount !== 1 ? "s" : ""} synced to your device
            </p>
          </div>
          <button
            onClick={() => setImportedCount(null)}
            className="py-2.5 px-6 rounded-xl bg-white/5 hover:bg-white/8 text-sm font-medium text-zinc-300 transition-colors"
          >
            Scan Another
          </button>
        </div>
      ) : (
        <>
          <Scanner onScan={handleScan} />
          <p className="text-xs text-zinc-500 text-center px-4">
            Point your camera at a friend's QR code to receive their messages
          </p>
        </>
      )}
    </div>
  );
}
