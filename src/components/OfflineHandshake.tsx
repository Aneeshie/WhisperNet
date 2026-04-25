import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Scanner } from "./Scanner";
import { generateHostOffer, processJoinerOfferAndGenerateAnswer, finalizeHostConnection } from "@/sync/offlineMesh";
import { X, WifiOff } from "lucide-react";

export function OfflineHandshake({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"SELECT" | "HOST" | "JOIN">("SELECT");
  const [step, setStep] = useState(1);
  const [offerId, setOfferId] = useState<string>("");
  const [qrData, setQrData] = useState<string>("");
  const [qrSrc, setQrSrc] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (qrData) {
      QRCode.toDataURL(qrData, {
        width: 800,
        margin: 2,
        errorCorrectionLevel: "L",
        color: { dark: "#ffffff", light: "#000000" }
      })
        .then(setQrSrc)
        .catch(console.error);
    }
  }, [qrData]);

  const handleStartHost = async () => {
    setMode("HOST");
    setStep(1);
    setLoading(true);
    try {
      const result = await generateHostOffer();
      setQrData(result.offer);
      setOfferId(result.offerId);
    } catch (e) {
      setError("Failed to generate Host Offer");
    } finally {
      setLoading(false);
    }
  };

  const handleStartJoin = () => {
    setMode("JOIN");
    setStep(1);
  };

  const handleJoinScan = async (scanned: string) => {
    setLoading(true);
    try {
      const answerStr = await processJoinerOfferAndGenerateAnswer(scanned);
      setQrData(answerStr);
      setStep(2);
    } catch (e) {
      setError("Invalid Host QR Code");
    } finally {
      setLoading(false);
    }
  };

  const handleHostScan = async (scanned: string) => {
    setLoading(true);
    try {
      await finalizeHostConnection(scanned, offerId);
      onClose(); // Success!
    } catch (e) {
      setError("Invalid Joiner QR Code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md flex flex-col relative overflow-hidden shadow-2xl">

        <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-5 h-5 text-zinc-400" />
            <h2 className="text-sm font-bold font-mono text-zinc-200">OFFLINE MESH HANDSHAKE</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center min-h-[400px]">
          {error && (
            <div className="mb-4 bg-red-950/50 border border-red-900 p-3 rounded text-xs text-red-500 font-mono w-full text-center">
              {error}
            </div>
          )}

          {mode === "SELECT" && (
            <div className="flex flex-col items-center justify-center space-y-6 w-full flex-1">
              <p className="text-center text-xs text-zinc-400 font-mono px-4 leading-relaxed">
                Connect two devices instantly over local Wi-Fi without internet.
                One device must Host, the other must Join.
              </p>

              <div className="flex flex-col w-full space-y-3 mt-4">
                <button
                  onClick={handleStartHost}
                  className="bg-blue-900/80 hover:bg-blue-800 text-blue-100 py-4 rounded-lg font-mono text-sm tracking-widest font-bold transition-all border border-blue-800"
                >
                  CREATE HOST
                </button>
                <button
                  onClick={handleStartJoin}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-4 rounded-lg font-mono text-sm tracking-widest font-bold transition-all border border-zinc-700"
                >
                  JOIN MESH
                </button>
              </div>
            </div>
          )}

          {mode === "HOST" && (
            <div className="flex flex-col items-center w-full space-y-6">
              <div className="flex items-center justify-between w-full px-4 mb-2">
                <span className={`text-xs font-mono font-bold ${step === 1 ? 'text-blue-400' : 'text-zinc-600'}`}>1. SHOW OFFER</span>
                <span className={`text-xs font-mono font-bold ${step === 2 ? 'text-blue-400' : 'text-zinc-600'}`}>2. SCAN ANSWER</span>
              </div>

              {step === 1 && (
                <>
                  <div className="w-80 h-80 bg-zinc-900 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-700 p-2">
                    {loading || !qrSrc ? (
                      <p className="text-xs font-mono text-zinc-500 animate-pulse">GENERATING OFFER...</p>
                    ) : (
                      <img src={qrSrc} className="w-full h-full object-contain" style={{ imageRendering: "pixelated" }} alt="Host Offer" />
                    )}
                  </div>
                  <p className="text-xs text-center text-zinc-400 font-mono mt-4">
                    Have the other device scan this QR code to initiate the handshake.
                  </p>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!qrSrc}
                    className="w-full bg-blue-900/80 hover:bg-blue-800 text-blue-100 py-3 rounded-lg font-mono text-xs tracking-widest font-bold disabled:opacity-50 mt-4"
                  >
                    NEXT: SCAN THEIR ANSWER
                  </button>
                </>
              )}

              {step === 2 && (
                <div className="flex flex-col items-center space-y-4">
                  <Scanner onScan={handleHostScan} />
                </div>
              )}
            </div>
          )}

          {mode === "JOIN" && (
            <div className="flex flex-col items-center w-full space-y-6">
              <div className="flex items-center justify-between w-full px-4 mb-2">
                <span className={`text-xs font-mono font-bold ${step === 1 ? 'text-blue-400' : 'text-zinc-600'}`}>1. SCAN HOST</span>
                <span className={`text-xs font-mono font-bold ${step === 2 ? 'text-blue-400' : 'text-zinc-600'}`}>2. SHOW ANSWER</span>
              </div>

              {step === 1 && (
                <div className="flex flex-col items-center space-y-4">
                  <Scanner onScan={handleJoinScan} />
                </div>
              )}

              {step === 2 && (
                <>
                  <div className="w-80 h-80 bg-zinc-900 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-700 p-2">
                    {loading || !qrSrc ? (
                      <p className="text-xs font-mono text-zinc-500 animate-pulse">GENERATING ANSWER...</p>
                    ) : (
                      <img src={qrSrc} className="w-full h-full object-contain" style={{ imageRendering: "pixelated" }} alt="Joiner Answer" />
                    )}
                  </div>
                  <p className="text-xs text-center text-zinc-400 font-mono mt-4">
                    Show this QR code back to the Host. Once scanned, the connection will be established!
                  </p>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
