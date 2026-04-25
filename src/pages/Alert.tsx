import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMessageStore } from "@/store";
import { v4 as uuidv4 } from "uuid";
import type { Message, MessageType, Priority } from "@/types/message";

const MESSAGE_TYPES: { value: MessageType; label: string; emoji: string }[] = [
  { value: "alert", label: "Alert", emoji: "🚨" },
  { value: "route", label: "Route", emoji: "🗺️" },
  { value: "news", label: "News", emoji: "📰" },
  { value: "resource", label: "Resource", emoji: "📦" },
];

const TTL_OPTIONS = [
  { hours: 1, label: "1 hour" },
  { hours: 12, label: "12 hours" },
  { hours: 24, label: "1 day" },
];

export default function Alert() {
  const navigate = useNavigate();
  const { addMessage } = useMessageStore();

  const [content, setContent] = useState("");
  const [type, setType] = useState<MessageType>("news");
  const [ttlHours, setTtlHours] = useState(12);

  const getPriorityForType = (t: MessageType): Priority => {
    switch (t) {
      case "alert": return "high";
      case "route": return "medium";
      default: return "low";
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    const now = Date.now();
    const expiresAt = now + (ttlHours * 3600000);

    const newMessage: Message = {
      id: `msg_${uuidv4().substring(0, 8)}`,
      type,
      priority: getPriorityForType(type),
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
      expiresAt,
      version: 1,
      hopCount: 0,
      maxHopCount: 10,
      trusted: true
    };

    await addMessage(newMessage);
    setContent("");
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">New Message</h1>
        <p className="text-xs text-zinc-500 mt-1">Share something with your mesh network</p>
      </header>

      <div className="flex-1 flex flex-col px-5 space-y-5 pb-8">

        {/* Type Selector */}
        <div className="space-y-2.5">
          <label className="text-sm font-medium text-zinc-400">Type</label>
          <div className="grid grid-cols-4 gap-2">
            {MESSAGE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all duration-200 ${
                  type === t.value
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-300 shadow-sm"
                    : "border-white/5 bg-white/3 text-zinc-500 hover:bg-white/5"
                }`}
              >
                <span className="text-lg">{t.emoji}</span>
                <span className="text-[11px] font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* TTL Selector */}
        <div className="space-y-2.5">
          <label className="text-sm font-medium text-zinc-400">Expires in</label>
          <div className="flex gap-2">
            {TTL_OPTIONS.map(({ hours, label }) => (
              <button
                key={hours}
                onClick={() => setTtlHours(hours)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  ttlHours === hours
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                    : "border-white/5 bg-white/3 text-zinc-500 hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-2.5 flex-1 flex flex-col">
          <label className="text-sm font-medium text-zinc-400">What's happening?</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-[120px] glass-card p-4 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/20 resize-none placeholder:text-zinc-600 transition-colors"
            placeholder="Type your message here..."
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            !content.trim()
              ? "bg-white/5 text-zinc-600 cursor-not-allowed"
              : "bg-blue-500/20 hover:bg-blue-500/25 text-blue-300 active:scale-[0.98]"
          }`}
        >
          Send Message
        </button>
      </div>
    </div>
  );
}
