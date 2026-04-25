import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import Feed from "@/pages/Feed";
import Alert from "@/pages/Alert";
import Scan from "@/pages/Scan";
import Settings from "@/pages/Settings";
import { initMesh } from "@/sync/mesh";

export default function App() {
  useEffect(() => {
    initMesh();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/20 selection:text-blue-200">
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(20, 20, 30, 0.9)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            borderRadius: "0.75rem",
          }
        }}
      />
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/alert" element={<Alert />} />
          <Route path="/scan/*" element={<Scan />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      {/* Persistent Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
