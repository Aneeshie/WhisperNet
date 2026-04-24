export default function Scan() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <header className="py-4 border-b border-zinc-900">
        <h1 className="text-xl font-bold tracking-tight">QR Drop & Scan</h1>
        <p className="text-xs font-mono text-zinc-500 mt-1">OPTICAL_LINK: READY</p>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="w-64 h-64 border-2 border-dashed border-zinc-700 rounded-xl flex items-center justify-center bg-zinc-950">
          <p className="text-xs font-mono text-zinc-500">CAMERA_FEED_PLACEHOLDER</p>
        </div>
        
        <div className="flex space-x-4 w-full max-w-xs">
          <button className="flex-1 py-3 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-300 active:bg-zinc-800 transition-colors">
            SCAN
          </button>
          <button className="flex-1 py-3 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-300 active:bg-zinc-800 transition-colors">
            SHARE
          </button>
        </div>
      </div>
    </div>
  );
}
