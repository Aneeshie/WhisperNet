import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import QRGen from "./QRGen";
import QRRead from "./QRRead";

export default function Scan() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <header className="py-4 border-b border-zinc-900">
        <h1 className="text-xl font-bold tracking-tight">QR Drop & Scan</h1>
        <p className="text-xs font-mono text-zinc-500 mt-1">OPTICAL_LINK: READY</p>
      </header>
      
      {/* Tab Navigation */}
      <div className="flex p-1 bg-zinc-900/50 border border-zinc-800 rounded">
        <NavLink
          to="/scan/read"
          className={({ isActive }) =>
            `flex-1 py-2 text-center text-xs font-mono tracking-wider uppercase rounded transition-colors ${
              isActive ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            }`
          }
        >
          SCAN
        </NavLink>
        <NavLink
          to="/scan/gen"
          className={({ isActive }) =>
            `flex-1 py-2 text-center text-xs font-mono tracking-wider uppercase rounded transition-colors ${
              isActive ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            }`
          }
        >
          GENERATE
        </NavLink>
      </div>

      <div className="flex-1 flex flex-col pt-4">
        <Routes>
          <Route path="/" element={<Navigate to="read" replace />} />
          <Route path="read" element={<QRRead />} />
          <Route path="gen" element={<QRGen />} />
        </Routes>
      </div>
    </div>
  );
}
