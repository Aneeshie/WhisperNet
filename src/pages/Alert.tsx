export default function Alert() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <header className="py-4 border-b border-zinc-900">
        <h1 className="text-xl font-bold tracking-tight text-red-500">Create Alert</h1>
        <p className="text-xs font-mono text-zinc-500 mt-1">BROADCAST_MODE: HIGH_PRIORITY</p>
      </header>
      
      <div className="flex-1 flex flex-col space-y-4 mt-4">
        <div className="bg-zinc-900/50 p-4 rounded-md border border-zinc-800">
          <p className="text-sm font-mono text-zinc-400 mb-2">MESSAGE_PAYLOAD</p>
          <textarea 
            className="w-full h-32 bg-black border border-zinc-800 rounded p-2 text-sm text-zinc-300 focus:outline-none focus:border-red-500/50 resize-none font-mono placeholder:text-zinc-700"
            placeholder="Enter critical alert message..."
          ></textarea>
        </div>
        
        <button className="w-full py-3 bg-red-950/30 text-red-500 border border-red-900/50 rounded flex items-center justify-center space-x-2 active:bg-red-900/50 transition-colors">
          <span className="font-mono text-sm tracking-widest font-bold">BROADCAST_ALERT</span>
        </button>
      </div>
    </div>
  );
}
