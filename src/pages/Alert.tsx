import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "@/store";
import { v4 as uuidv4 } from "uuid";
import type { Message, MessageType, Priority } from "@/types/message";

export default function Alert() {
  const navigate = useNavigate();
  const { addMessage } = useUIStore();
  
  const [content, setContent] = useState("");
  const [type, setType] = useState<MessageType>("alert");
  const [ttlHours, setTtlHours] = useState(12);

  const getPriorityForType = (t: MessageType): Priority => {
    switch (t) {
      case "alert": return "high";
      case "route": return "medium";
      default: return "low";
    }
  };

  const handleSubmit = () => {
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

    addMessage(newMessage);
    navigate("/"); // Redirect to feed to see it immediately
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <header className="py-4 border-b border-zinc-900">
        <h1 className="text-xl font-bold tracking-tight text-red-500">Create Alert</h1>
        <p className="text-xs font-mono text-zinc-500 mt-1">BROADCAST_MODE: ACTIVE</p>
      </header>
      
      <div className="flex-1 flex flex-col space-y-4 mt-4 pb-8">
        
        {/* Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(['alert', 'route', 'news', 'resource'] as MessageType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-2 px-3 rounded text-xs font-mono tracking-wider uppercase border transition-colors ${
                  type === t 
                    ? t === 'alert' ? 'border-red-900 bg-red-950/30 text-red-400' : 'border-zinc-500 bg-zinc-800 text-zinc-100'
                    : 'border-zinc-800 bg-zinc-900/50 text-zinc-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* TTL Selector */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Time To Live (TTL)</label>
          <div className="flex space-x-2">
            {[1, 12, 24].map((hours) => (
              <button
                key={hours}
                onClick={() => setTtlHours(hours)}
                className={`flex-1 py-2 rounded text-xs font-mono border transition-colors ${
                  ttlHours === hours
                    ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                    : 'border-zinc-800 bg-zinc-900/50 text-zinc-500'
                }`}
              >
                {hours}H
              </button>
            ))}
          </div>
        </div>

        {/* Message Payload */}
        <div className="bg-zinc-900/50 p-4 rounded-md border border-zinc-800 mt-2">
          <p className="text-sm font-mono text-zinc-400 mb-2">MESSAGE_PAYLOAD</p>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-32 bg-black border border-zinc-800 rounded p-2 text-sm text-zinc-300 focus:outline-none focus:border-red-500/50 resize-none font-mono placeholder:text-zinc-700"
            placeholder="Enter message details..."
          />
        </div>
        
        {/* Submit Button */}
        <button 
          onClick={handleSubmit}
          disabled={!content.trim()}
          className={`w-full py-3 mt-4 border rounded flex items-center justify-center space-x-2 transition-colors ${
            !content.trim() 
              ? 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
              : type === 'alert'
                ? 'bg-red-950/30 text-red-500 border-red-900/50 active:bg-red-900/50'
                : 'bg-zinc-800 text-zinc-100 border-zinc-600 active:bg-zinc-700'
          }`}
        >
          <span className="font-mono text-sm tracking-widest font-bold">BROADCAST</span>
        </button>
      </div>
    </div>
  );
}
