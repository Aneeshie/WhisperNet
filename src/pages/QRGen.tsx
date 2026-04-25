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
    <div className="flex-1 flex flex-col items-center justify-center space-y-8">
      <AnimatedQR payload={payloadString} />
      
      <div className="text-center">
        <p className="text-[10px] font-mono text-zinc-600 max-w-xs mx-auto mt-4">
          Present this animated optical pattern to another node to propagate local mesh state.
        </p>
      </div>
    </div>
  );
}
