import { useEffect, useState } from "react";
import { useUIStore } from "@/store";
import { Clock, Navigation, AlertTriangle, Info } from "lucide-react";
import type { Message } from "@/types/message";

export default function Feed() {
  const { messages, fetchMessages, peerCount } = useUIStore();

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // updates every minute

    return () => clearInterval(interval);
  }, []);

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
      <header className="py-4 border-b border-zinc-900">
        <h1 className="text-xl font-bold tracking-tight">WhisperNet Feed</h1>

        <p className={`text-xs font-mono mt-1 ${peerCount > 0 ? "text-green-500" : "text-zinc-500"}`}>
          NODE_STATUS: {peerCount > 0 ? `ONLINE_MESH (${peerCount} PEERS)` : "OFFLINE_MESH"} | MSGS: {messages.length}
        </p>
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
