import { NavLink } from "react-router-dom";
import { Home, TriangleAlert, ScanLine, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Feed", icon: Home },
  { path: "/alert", label: "Alert", icon: TriangleAlert },
  { path: "/scan", label: "Scan", icon: ScanLine },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-zinc-950 border-t border-zinc-900 pb-safe pt-2 px-2 h-16">
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 text-zinc-500 transition-colors hover:text-zinc-300",
              isActive && "text-zinc-50"
            )
          }
        >
          <Icon className="w-6 h-6" strokeWidth={2} />
          <span className="text-[10px] font-mono tracking-wider uppercase">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
