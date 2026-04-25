import { useEffect, useState } from "react";
import { useNetworkStore, useMessageStore } from "@/store";
import { Clock, Navigation, AlertTriangle, Info, Wifi } from "lucide-react";
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
  // Track offline tunnel count as local state so component re-renders when it changes
  const [offlinePeerCount, setOfflinePeerCount] = useState(0);

  // Poll offline tunnel count every second so UI stays in sync
  useEffect(() => {
    const interval = setInterval(() => {
      setOfflinePeerCount(offlineDataChannels.size);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isOfflineMeshConnected = offlinePeerCount > 0;
  const isGlobalMeshReady = !!myPeerId;

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // updates every minute

    return () => clearInterval(interval);
  }, []);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (connectId.trim()) {
      connectToPeer(connectId.trim());
      setConnectId("");
    }
  };

  const getMessageConfig = (type: string) => {
    switch (type) {
      case "alert":
        return {
          icon: AlertTriangle,
          borderColor: "border-red-900/80",
          bgColor: "bg-red-950/20",
          textColor: "text-red-500",
          label: "CRITICAL ALERT",
        };

      case "route":
        return {
          icon: Navigation,
          borderColor: "border-blue-900/80",
          bgColor: "bg-blue-950/20",
          textColor: "text-blue-400",
          label: "ROUTE UPDATE",
        };

      default:
        return {
          icon: Info,
          borderColor: "border-zinc-800",
          bgColor: "bg-zinc-900/50",
          textColor: "text-zinc-300",
          label: "GENERAL NEWS",
        };
    }
  };

  const formatTimeAgo = (ms: number) => {
    const minutes = Math.floor((now - ms) / 60000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return `${Math.floor(hours / 24)}d ago`;
  };

  const sortedMessages = [...messages].sort(
    (a, b) => b.createdAt - a.createdAt,
  );

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {showOfflineHandshake && <OfflineHandshake onClose={() => setShowOfflineHandshake(false)} />}
      
      <header className="py-4 border-b border-zinc-900 space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">WhisperNet Feed</h1>
          <p className={`text-xs font-mono mt-1 ${
            peerCount > 0 ? "text-green-500" :
            isOfflineMeshConnected ? "text-orange-400" :
            "text-zinc-500"
          }`}>
            NODE_STATUS: {
              peerCount > 0 ? `ONLINE_MESH (${peerCount} PEERS)` :
              isOfflineMeshConnected ? `LOCAL_MESH (${offlinePeerCount} PEERS)` :
              "OFFLINE_MESH"
            } | MSGS: {messages.length}
          </p>
        </div>

        {isOfflineMeshConnected ? (
          // Offline QR tunnel is live — show green connected card
          <div className="bg-green-950/20 border border-green-900/50 p-3 rounded-lg flex flex-col space-y-3">
            <div className="flex items-start space-x-3">
              <Wifi className="w-5 h-5 text-green-400 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-green-400 font-mono tracking-wide">LOCAL MESH ACTIVE</h3>
                <p className="text-xs text-green-300/80 font-mono leading-relaxed">
                  Connected to {offlinePeerCount} peer{offlinePeerCount > 1 ? "s" : ""} via local Wi-Fi WebRTC tunnel. Messages are routing without the internet.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowOfflineHandshake(true)}
              className="w-full bg-green-900/30 hover:bg-green-900/50 border border-green-900/50 text-green-100 py-2 rounded-md font-mono text-xs tracking-wider transition-colors font-bold"
            >
              ADD MORE PEERS
            </button>
          </div>
        ) : !isGlobalMeshReady ? (
          // No internet, no offline tunnel — show the prompt to start handshake
          <div className="bg-red-950/20 border border-red-900/50 p-3 rounded-lg flex flex-col space-y-3">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-red-500 font-mono tracking-wide">OFFLINE MODE</h3>
                <p className="text-xs text-red-400/80 font-mono leading-relaxed">
                  No internet connection detected. The global mesh is unavailable. You can sync via the Scan page, or establish a live offline Wi-Fi mesh below.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowOfflineHandshake(true)}
              className="w-full bg-red-900/40 hover:bg-red-900/60 border border-red-900/50 text-red-100 py-2 rounded-md font-mono text-xs tracking-wider transition-colors font-bold"
            >
              START QR MESH HANDSHAKE
            </button>
          </div>
        ) : (
          // Internet available — show global mesh card
          <div className="bg-blue-950/20 border border-blue-900/50 p-3 rounded-lg space-y-3">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-blue-400 font-mono tracking-wide">GLOBAL MESH READY</h3>
                <p className="text-xs text-blue-300/80 font-mono leading-relaxed">
                  You are connected to the global matchmaking server. Share your ID below, or enter a friend's ID to establish a secure P2P WebRTC tunnel.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded px-3 py-2 flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-500">MY ID:</span>
                <span className="text-sm text-zinc-100 select-all font-bold tracking-wider">{myPeerId}</span>
              </div>
              
              <form onSubmit={handleConnect} className="flex-1 flex gap-2">
                <input 
                  type="text" 
                  value={connectId}
                  onChange={(e) => setConnectId(e.target.value)}
                  placeholder="Enter Peer ID..." 
                  className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-900/80 transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={!connectId.trim()}
                  className="bg-blue-900/80 hover:bg-blue-800 text-blue-100 text-xs font-mono px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold tracking-wide"
                >
                  CONNECT
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 space-y-4 pb-4">
        {sortedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-zinc-600 font-mono">
              No messages in local mesh.
            </p>
          </div>
        ) : (
          sortedMessages.map((msg: Message) => {
            const config = getMessageConfig(msg.type);
            const Icon = config.icon;

            return (
              <div
                key={msg.id}
                className={`p-4 rounded-md border ${config.borderColor} ${config.bgColor}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${config.textColor}`} />

                    <span
                      className={`text-xs font-mono font-bold tracking-widest ${config.textColor}`}
                    >
                      {config.label}
                    </span>
                  </div>

                  <div className="flex items-center text-zinc-500 space-x-1">
                    <Clock className="w-3 h-3" />

                    <span className="text-[10px] font-mono">
                      {formatTimeAgo(msg.createdAt)}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-zinc-100 font-sans leading-relaxed my-3">
                  {msg.content}
                </p>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800/50">
                  <span className="text-[10px] font-mono text-zinc-600">
                    ID: {msg.id.split("_")[1] || msg.id}
                  </span>

                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950/50 px-2 py-0.5 rounded">
                    HOPS: {msg.hopCount}/{msg.maxHopCount}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
