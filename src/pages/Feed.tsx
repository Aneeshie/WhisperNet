import { useEffect, useState } from "react";
import { useNetworkStore, useMessageStore } from "@/store";
import { Clock, Users, Link2, Wifi } from "lucide-react";
import type { Message } from "@/types/message";
import { connectToPeer } from "@/sync/mesh";
import { OfflineHandshake } from "@/components/OfflineHandshake";
import { offlineDataChannels } from "@/sync/offlineMesh";

export default function Feed() {
  const { messages, fetchMessages } = useMessageStore();
  const { peerCount, myPeerId } = useNetworkStore();

  const [now, setNow] = useState(() => Date.now());
  const [connectId, setConnectId] = useState("");
  const [showOfflineHandshake, setShowOfflineHandshake] = useState(false);
  const [offlinePeerCount, setOfflinePeerCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setOfflinePeerCount(offlineDataChannels.size);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isOfflineMeshConnected = offlinePeerCount > 0;
  const isGlobalMeshReady = !!myPeerId;
  const totalPeers = peerCount + offlinePeerCount;

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (connectId.trim()) {
      connectToPeer(connectId.trim());
      setConnectId("");
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case "alert":
        return { emoji: "🚨", bg: "bg-red-500/5 border-red-500/10", label: "Alert" };
      case "route":
        return { emoji: "🗺️", bg: "bg-blue-500/5 border-blue-500/10", label: "Route" };
      case "news":
        return { emoji: "📰", bg: "bg-emerald-500/5 border-emerald-500/10", label: "News" };
      default:
        return { emoji: "📦", bg: "bg-zinc-500/5 border-zinc-500/10", label: "Resource" };
    }
  };

  const formatTimeAgo = (ms: number) => {
    const minutes = Math.floor((now - ms) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const sortedMessages = [...messages].sort((a, b) => b.createdAt - a.createdAt);
  const filteredMessages = activeFilter
    ? sortedMessages.filter((m) => m.type === activeFilter)
    : sortedMessages;

  const FILTERS = [
    { value: null, label: "All", count: messages.length },
    { value: "alert", label: "🚨 Alerts", count: messages.filter((m) => m.type === "alert").length },
    { value: "news", label: "📰 News", count: messages.filter((m) => m.type === "news").length },
    { value: "route", label: "🗺️ Routes", count: messages.filter((m) => m.type === "route").length },
    { value: "resource", label: "📦 Resources", count: messages.filter((m) => m.type === "resource").length },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      {showOfflineHandshake && <OfflineHandshake onClose={() => setShowOfflineHandshake(false)} />}

      {/* Header */}
      <header className="px-5 pt-6 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">WhisperNet</h1>
            {/* Status pill */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {totalPeers > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-soft-pulse" />
                  <span className="text-xs text-emerald-400/90 font-medium">
                    Connected · {totalPeers} nearby
                  </span>
                </>
              ) : isGlobalMeshReady ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-soft-pulse" />
                  <span className="text-xs text-blue-400/90 font-medium">
                    Online · Ready to connect
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-zinc-500" />
                  <span className="text-xs text-zinc-500 font-medium">
                    Offline
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalPeers > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full glow-green">
                <Users className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{totalPeers}</span>
              </div>
            )}
          </div>
        </div>

        {/* Connection Cards */}
        {isOfflineMeshConnected && (
          <div className="glass-card p-4 glow-green">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-emerald-300">Local Mesh Active</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {offlinePeerCount} device{offlinePeerCount > 1 ? "s" : ""} connected via Wi-Fi
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowOfflineHandshake(true)}
              className="w-full mt-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 text-xs font-medium transition-colors"
            >
              Add More Devices
            </button>
          </div>
        )}

        {isGlobalMeshReady ? (
          <div className="glass-card p-4 glow-blue">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-blue-300">
                  {peerCount > 0 ? `Connected · ${peerCount} peer${peerCount > 1 ? "s" : ""}` : "Ready to Connect"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Your ID: <span className="text-zinc-200 font-semibold select-all">{myPeerId}</span>
                </p>
              </div>
            </div>
            <form onSubmit={handleConnect} className="flex gap-2">
              <input
                type="text"
                value={connectId}
                onChange={(e) => setConnectId(e.target.value)}
                placeholder="Enter friend's ID..."
                className="flex-1 bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/40 transition-colors placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={!connectId.trim()}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </form>
          </div>
        ) : !isOfflineMeshConnected && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-200">No Connection</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Connect to a friend nearby to start sharing messages
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowOfflineHandshake(true)}
              className="w-full mt-3 py-2.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/20 text-blue-300 text-sm font-medium transition-colors"
            >
              Connect Nearby
            </button>
          </div>
        )}
      </header>

      {/* Category Filters */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setActiveFilter(f.value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeFilter === f.value
                ? "bg-white/10 text-zinc-100 shadow-sm"
                : "bg-white/3 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeFilter === f.value ? "bg-white/10" : "bg-white/5"
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="h-px bg-white/5 mx-5" />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-sm text-zinc-600">
              {activeFilter ? `No ${activeFilter} messages` : "No messages yet"}
            </p>
            <p className="text-xs text-zinc-700 mt-1">
              {activeFilter ? "Try a different filter" : "Messages from your mesh will appear here"}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg: Message) => {
            const style = getMessageStyle(msg.type);

            return (
              <div
                key={msg.id}
                className={`glass-card p-4 border ${style.bg} transition-all duration-200 hover:border-white/10`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{style.emoji}</span>
                    <span className="text-xs font-medium text-zinc-400">{style.label}</span>
                    {msg.signature ? (
                      msg.trusted ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium" title="Signature verified">✓ signed</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium" title="Signature invalid or tampered">⚠ unverified</span>
                      )
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 text-zinc-600">
                    <Clock className="w-3 h-3" />
                    <span className="text-[11px]">{formatTimeAgo(msg.createdAt)}</span>
                  </div>
                </div>

                <p className="text-[15px] text-zinc-200 leading-relaxed">
                  {msg.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
