import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import QRGen from "./QRGen";
import QRRead from "./QRRead";

export default function Scan() {
  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Share Messages</h1>
        <p className="text-xs text-zinc-500 mt-1">Send or receive messages via QR code</p>
      </header>

      {/* Tab Navigation */}
      <div className="mx-5 flex p-1 bg-white/3 border border-white/5 rounded-xl">
        <NavLink
          to="/scan/read"
          className={({ isActive }) =>
            `flex-1 py-2.5 text-center text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive ? "bg-white/8 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`
          }
        >
          Receive
        </NavLink>
        <NavLink
          to="/scan/gen"
          className={({ isActive }) =>
            `flex-1 py-2.5 text-center text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive ? "bg-white/8 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`
          }
        >
          Send
        </NavLink>
      </div>

      <div className="flex-1 flex flex-col px-5 pt-4">
        <Routes>
          <Route path="/" element={<Navigate to="read" replace />} />
          <Route path="read" element={<QRRead />} />
          <Route path="gen" element={<QRGen />} />
        </Routes>
      </div>
    </div>
  );
}
