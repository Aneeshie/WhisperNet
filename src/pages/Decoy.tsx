import { useState } from "react";
import { useSecurityStore } from "@/store";
import { Search, Sun, CloudRain, Wind, Droplets } from "lucide-react";

export default function Decoy() {
  const { unlock } = useSecurityStore();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim() === "") return;
    
    // Check if it's the PIN
    const isUnlocked = unlock(searchValue.trim());
    if (!isUnlocked) {
      // Fake action for real weather search feeling
      setSearchValue("");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-sky-400 to-sky-600 text-white font-sans selection:bg-white/30">
      {/* Search Bar / PIN input */}
      <div className="px-5 pt-12 pb-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search for a city..."
            className="w-full bg-black/10 border border-white/20 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/60 focus:outline-none focus:bg-black/20 focus:border-white/40 transition-all"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </form>
      </div>

      {/* Main Weather Display */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-20 animate-fade-in-up">
        <h1 className="text-3xl font-semibold mb-2 tracking-tight text-center">Mawlynnong</h1>
        <p className="text-sky-100 text-lg mb-8">Partly Cloudy</p>
        
        <div className="flex items-center justify-center gap-6 mb-12">
          <Sun className="w-24 h-24 text-yellow-300 drop-shadow-lg" />
          <div className="text-8xl font-light tracking-tighter">
            24°
          </div>
        </div>

        {/* Fake Stats */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          <div className="bg-black/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center">
            <Wind className="w-6 h-6 text-white/80 mb-2" />
            <span className="text-sm font-medium">19 km/h</span>
            <span className="text-xs text-white/60">Wind</span>
          </div>
          <div className="bg-black/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center">
            <Droplets className="w-6 h-6 text-white/80 mb-2" />
            <span className="text-sm font-medium">45%</span>
            <span className="text-xs text-white/60">Humidity</span>
          </div>
          <div className="bg-black/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center">
            <CloudRain className="w-6 h-6 text-white/80 mb-2" />
            <span className="text-sm font-medium">10%</span>
            <span className="text-xs text-white/60">Rain</span>
          </div>
        </div>
      </div>
    </div>
  );
}
