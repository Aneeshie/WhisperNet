import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { exportBundle } from "@/qr/exportBundle";
import { AnimatedQR } from "@/components/AnimatedQR";
import QRCode from "qrcode";
import { Download, Zap, Image } from "lucide-react";

export default function QRGen() {
  const [payloadString, setPayloadString] = useState<string>("");
  const [mode, setMode] = useState<"animated" | "static">("animated");
  const [staticQrUrl, setStaticQrUrl] = useState<string>("");
  const [tooLarge, setTooLarge] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Generate static QR when mode switches or payload changes
  useEffect(() => {
    if (mode !== "static" || !payloadString) return;

    // QR Version 40 max: ~4296 alphanumeric chars with L error correction
    if (payloadString.length > 4000) {
      setTooLarge(true);
      setStaticQrUrl("");
      return;
    }

    setTooLarge(false);

    QRCode.toDataURL(
      payloadString,
      {
        width: 1024,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "L", // Low error correction = max data capacity
      },
      (err, url) => {
        if (err) {
          console.error("Static QR generation failed", err);
          setTooLarge(true);
        } else {
          setStaticQrUrl(url);
        }
      }
    );
  }, [mode, payloadString]);

  const handleDownload = () => {
    if (!staticQrUrl) return;
    const link = document.createElement("a");
    link.download = `whispernet-${Date.now()}.png`;
    link.href = staticQrUrl;
    link.click();
    toast.success("QR code saved!");
  };

  return (
    <div className="flex-1 flex flex-col items-center space-y-5">

      {/* Mode Toggle */}
      <div className="flex p-1 bg-white/3 border border-white/5 rounded-xl w-full max-w-xs">
        <button
          onClick={() => setMode("animated")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            mode === "animated" ? "bg-white/8 text-zinc-100 shadow-sm" : "text-zinc-500"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Animated
        </button>
        <button
          onClick={() => setMode("static")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            mode === "static" ? "bg-white/8 text-zinc-100 shadow-sm" : "text-zinc-500"
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          Static
        </button>
      </div>

      {/* QR Display */}
      {mode === "animated" ? (
        <>
          <AnimatedQR payload={payloadString} />
          <div className="text-center px-8">
            <p className="text-sm text-zinc-400">
              Show this QR code to a friend to share your messages
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              They'll need to open the Receive tab and scan it
            </p>
          </div>
        </>
      ) : (
        <>
          {!payloadString ? (
            <div className="w-72 h-72 rounded-2xl bg-white/3 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-zinc-500">Generating...</p>
              </div>
            </div>
          ) : tooLarge ? (
            <div className="w-72 h-72 rounded-2xl bg-white/3 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                  <Image className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-300">Too many messages</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  A single QR code can't hold all your messages. Use the Animated mode to send them all, or clear older messages first.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-72 h-72 rounded-2xl bg-white p-3 flex items-center justify-center shadow-lg shadow-black/30">
              <img
                src={staticQrUrl}
                alt="Static QR Code"
                className="w-full h-full object-contain"
                style={{ imageRendering: "pixelated" }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          <div className="text-center px-8 space-y-3">
            <p className="text-sm text-zinc-400">
              {tooLarge
                ? "Switch to Animated mode to share all messages"
                : "A single QR code — perfect for printing or wall displays"
              }
            </p>
            {staticQrUrl && !tooLarge && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/20 text-blue-300 text-sm font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                Save as Image
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
