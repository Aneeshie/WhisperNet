import { useUIStore } from "@/store";

export default function Settings() {
  const { isNavigating, setNavigating } = useUIStore();

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <header className="py-4 border-b border-zinc-900">
        <h1 className="text-xl font-bold tracking-tight">Node Settings</h1>
        <p className="text-xs font-mono text-zinc-500 mt-1">LOCAL_CONFIG: ACTIVE</p>
      </header>
      
      <div className="flex-1 space-y-6 mt-4">
        <div className="space-y-2">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Identity</h2>
          <div className="bg-zinc-900/30 p-3 rounded border border-zinc-800 flex justify-between items-center">
            <span className="text-sm font-mono text-zinc-400">NODE_ID</span>
            <span className="text-sm font-mono text-zinc-100">usr_8f92a1b</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Storage</h2>
          <div className="bg-zinc-900/30 p-3 rounded border border-zinc-800 flex flex-col space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-mono text-zinc-400">LOCAL_DB_SIZE</span>
              <span className="text-sm font-mono text-zinc-100">1.2 MB</span>
            </div>
            <button className="text-xs font-mono text-red-500 self-start mt-2 border border-red-900/50 bg-red-950/20 px-2 py-1 rounded">
              PURGE_DATA
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">State Verification (Dev)</h2>
          <div className="bg-zinc-900/30 p-3 rounded border border-zinc-800 flex justify-between items-center">
            <span className="text-sm font-mono text-zinc-400">ZUSTAND_STORE</span>
            <button 
              onClick={() => setNavigating(!isNavigating)}
              className={`text-xs font-mono px-2 py-1 rounded border transition-colors ${
                isNavigating 
                  ? 'border-green-900/50 bg-green-950/20 text-green-500' 
                  : 'border-zinc-700 bg-zinc-800 text-zinc-300'
              }`}
            >
              NAVIGATING: {isNavigating ? 'TRUE' : 'FALSE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
