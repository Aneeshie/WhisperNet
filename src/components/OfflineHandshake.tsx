import { useState } from "react";
import { Scanner } from "./Scanner";
import { AnimatedQR } from "./AnimatedQR";
import { generateHostOffer, processJoinerOfferAndGenerateAnswer, finalizeHostConnection } from "@/sync/offlineMesh";
import { X, Wifi } from "lucide-react";

export function OfflineHandshake({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"SELECT" | "HOST" | "JOIN">("SELECT");
  const [step, setStep] = useState(1);
  const [offerId, setOfferId] = useState<string>("");
  const [qrData, setQrData] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStartHost = async () => {
    setError("");
    setMode("HOST");
    setStep(1);
    setLoading(true);
    try {
      const result = await generateHostOffer();
      setQrData(result.offer);
      setOfferId(result.offerId);
    } catch (e) {
      setError("Failed to create connection code. Make sure Wi-Fi is enabled.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartJoin = () => {
    setError("");
    setMode("JOIN");
    setStep(1);
  };

  const handleJoinScan = async (scanned: string) => {
    setError("");
    setLoading(true);
    try {
      const answerStr = await processJoinerOfferAndGenerateAnswer(scanned);
      setQrData(answerStr);
      setStep(2);
    } catch (e) {
      setError("Couldn't read that QR code. Ask your friend to try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHostScan = async (scanned: string) => {
    setError("");
    setLoading(true);
    try {
      await finalizeHostConnection(scanned, offerId);
      setStep(3);
      setTimeout(() => {
        onClose();
      }, 4000);
    } catch (e) {
      setError("Couldn't read that QR code. Ask your friend to try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xl">
      <div className="glass-card w-full max-w-md flex flex-col relative overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-200">Connect Nearby</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center min-h-[400px]">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/15 p-3 rounded-xl text-xs text-red-400 w-full text-center">
              {error}
            </div>
          )}

          {mode === "SELECT" && (
            <div className="flex flex-col items-center justify-center space-y-5 w-full flex-1">
              <div className="text-center px-4">
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">Connect via Wi-Fi</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Both devices must be on the same Wi-Fi network. One shows a code, the other scans it.
                </p>
              </div>

              <div className="flex flex-col w-full space-y-2.5 mt-2">
                <button
                  onClick={handleStartHost}
                  className="py-4 rounded-xl bg-blue-500/15 hover:bg-blue-500/20 text-blue-300 text-sm font-medium transition-all"
                >
                  Show My Code
                </button>
                <button
                  onClick={handleStartJoin}
                  className="py-4 rounded-xl bg-white/5 hover:bg-white/8 text-zinc-300 text-sm font-medium transition-all"
                >
                  Scan Friend's Code
                </button>
              </div>
            </div>
          )}

          {mode === "HOST" && (
            <div className="flex flex-col items-center w-full space-y-5">
              {/* Step indicators */}
              <div className="flex items-center gap-3 w-full px-2">
                <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-blue-400' : 'text-zinc-600'}`}>
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${step >= 1 ? 'bg-blue-500/20' : 'bg-white/5'}`}>1</span>
                  <span className="text-xs font-medium">Show code</span>
                </div>
                <div className="flex-1 h-px bg-white/10" />
                <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-blue-400' : 'text-zinc-600'}`}>
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${step >= 2 ? 'bg-blue-500/20' : 'bg-white/5'}`}>2</span>
                  <span className="text-xs font-medium">Scan response</span>
                </div>
              </div>

              {step === 1 && (
                <>
                  {loading || !qrData ? (
                    <div className="w-72 h-72 rounded-2xl bg-white/3 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-zinc-500">Creating connection code...</p>
                      </div>
                    </div>
                  ) : (
                    <AnimatedQR payload={qrData} />
                  )}
                  <p className="text-xs text-zinc-500 text-center">
                    Show this to your friend and ask them to scan it
                  </p>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!qrData}
                    className="w-full py-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/20 text-blue-300 text-sm font-medium disabled:opacity-30 transition-all"
                  >
                    They scanned it — next step
                  </button>
                </>
              )}

              {step === 2 && (
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-xs text-zinc-500 text-center mb-2">
                    Now scan the code your friend is showing you
                  </p>
                  <Scanner onScan={handleHostScan} />
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col items-center justify-center space-y-4 py-12">
                  <div className="w-14 h-14 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <h3 className="text-base font-semibold text-emerald-300">Connecting...</h3>
                  <p className="text-xs text-zinc-500 text-center leading-relaxed px-4">
                    Setting up the local Wi-Fi tunnel. This only takes a few seconds.
                  </p>
                </div>
              )}
            </div>
          )}

          {mode === "JOIN" && (
            <div className="flex flex-col items-center w-full space-y-5">
              {/* Step indicators */}
              <div className="flex items-center gap-3 w-full px-2">
                <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-blue-400' : 'text-zinc-600'}`}>
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${step >= 1 ? 'bg-blue-500/20' : 'bg-white/5'}`}>1</span>
                  <span className="text-xs font-medium">Scan code</span>
                </div>
                <div className="flex-1 h-px bg-white/10" />
                <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-blue-400' : 'text-zinc-600'}`}>
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${step >= 2 ? 'bg-blue-500/20' : 'bg-white/5'}`}>2</span>
                  <span className="text-xs font-medium">Show response</span>
                </div>
              </div>

              {step === 1 && (
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-xs text-zinc-500 text-center mb-2">
                    Scan the code your friend is showing you
                  </p>
                  <Scanner onScan={handleJoinScan} />
                </div>
              )}

              {step === 2 && (
                <>
                  {loading || !qrData ? (
                    <div className="w-72 h-72 rounded-2xl bg-white/3 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-zinc-500">Creating response code...</p>
                      </div>
                    </div>
                  ) : (
                    <AnimatedQR payload={qrData} />
                  )}
                  <p className="text-xs text-zinc-500 text-center">
                    Now show this code back to your friend so they can scan it
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
