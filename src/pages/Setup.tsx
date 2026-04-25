import { useState } from "react";
import { useSecurityStore } from "@/store";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function Setup() {
  const { completeSetup } = useSecurityStore();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");

  const handleSetPin = () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 characters");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleConfirm = () => {
    if (confirmPin !== pin) {
      setError("PINs don't match. Try again.");
      setConfirmPin("");
      return;
    }
    completeSetup(pin);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[oklch(0.10_0.02_260)] to-[oklch(0.06_0.005_260)] text-white font-sans">
      <div className="flex-1 flex flex-col items-center justify-center px-8 animate-fade-in-up">

        {/* Logo / Icon */}
        <div className="w-20 h-20 rounded-3xl bg-blue-500/15 flex items-center justify-center mb-8 glow-blue">
          <Shield className="w-10 h-10 text-blue-400" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to WhisperNet</h1>
        <p className="text-sm text-zinc-400 text-center mb-10 max-w-xs leading-relaxed">
          A private, peer-to-peer mesh network. Set a PIN to keep your messages safe.
        </p>

        {error && (
          <div className="w-full max-w-xs mb-4 bg-red-500/10 border border-red-500/15 p-3 rounded-xl text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="w-full max-w-xs space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Create a PIN</label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN..."
                  className="w-full glass-card px-4 py-3.5 text-base text-center tracking-[0.3em] font-semibold focus:outline-none focus:border-blue-500/30 transition-colors placeholder:text-zinc-600 placeholder:tracking-normal"
                  autoFocus
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-zinc-600 text-center">At least 4 characters</p>
            </div>

            <button
              onClick={handleSetPin}
              disabled={pin.length < 4}
              className="w-full py-3.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/25 text-blue-300 text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="w-full max-w-xs space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Confirm your PIN</label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Re-enter PIN..."
                className="w-full glass-card px-4 py-3.5 text-base text-center tracking-[0.3em] font-semibold focus:outline-none focus:border-blue-500/30 transition-colors placeholder:text-zinc-600 placeholder:tracking-normal"
                autoFocus
                autoComplete="off"
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              />
            </div>

            <button
              onClick={handleConfirm}
              disabled={confirmPin.length < 4}
              className="w-full py-3.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/25 text-blue-300 text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Set PIN & Enter
            </button>

            <button
              onClick={() => { setStep(1); setConfirmPin(""); setError(""); }}
              className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Go back
            </button>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-[11px] text-zinc-600 leading-relaxed max-w-xs">
            This app disguises itself as a weather app. To unlock it later, type your PIN into the search bar.
          </p>
        </div>
      </div>
    </div>
  );
}
