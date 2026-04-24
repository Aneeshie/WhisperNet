export default function Feed() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <header className="py-4 border-b border-zinc-900">
        <h1 className="text-xl font-bold tracking-tight">WhisperNet Feed</h1>
        <p className="text-xs font-mono text-zinc-500 mt-1">NODE_STATUS: OFFLINE_MESH</p>
      </header>
      
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-zinc-600 font-mono">No messages in local mesh.</p>
      </div>
    </div>
  );
}
