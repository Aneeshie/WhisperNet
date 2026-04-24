import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import BottomNav from "@/components/BottomNav";
import Feed from "@/pages/Feed";
import Alert from "@/pages/Alert";
import Scan from "@/pages/Scan";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-50 font-sans selection:bg-zinc-800">
      <Toaster theme="dark" position="top-center" />
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/alert" element={<Alert />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      {/* Persistent Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
