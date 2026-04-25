import { useEffect, useState } from "react";
import { toast } from "sonner";
import { exportBundle } from "@/qr/exportBundle";
import { AnimatedQR } from "@/components/AnimatedQR";

export default function QRGen() {
  const [payloadString, setPayloadString] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function generatePayload() {
      try {
        const payload = await exportBundle();
        if (isMounted) {
          setPayloadString(payload);
        }
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
    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
      <AnimatedQR payload={payloadString} />

      <div className="text-center px-8">
        <p className="text-sm text-zinc-400">
          Show this QR code to a friend to share your messages
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          They'll need to open the Receive tab and scan it
        </p>
      </div>
    </div>
  );
}
