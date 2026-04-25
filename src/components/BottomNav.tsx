import { NavLink } from "react-router-dom";
import { MessageCircle, PenLine, QrCode, Settings, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSecurityStore } from "@/store";

type NavItem = {
  path?: string;
  action?: string;
  label: string;
  icon: React.ElementType;
};

const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Messages", icon: MessageCircle },
  { path: "/alert", label: "New", icon: PenLine },
  { path: "/scan", label: "Share", icon: QrCode },
  { path: "/settings", label: "Settings", icon: Settings },
  { action: "lock", label: "Lock", icon: Lock },
];

export default function BottomNav() {
  const { lock } = useSecurityStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-[oklch(0.08_0.005_260)] border-t border-white/5 pb-safe pt-1 px-2 h-16">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        
        if (item.action === "lock") {
          return (
            <button
              key="lock"
              onClick={lock}
              className="flex flex-col items-center justify-center w-full h-full space-y-0.5 transition-all duration-200 text-zinc-500 hover:text-zinc-300"
            >
              <div className="flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200">
                <Icon className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </button>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path!}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-full h-full space-y-0.5 transition-all duration-200",
                isActive
                  ? "text-blue-400"
                  : "text-zinc-500 hover:text-zinc-300"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
                  isActive && "bg-blue-500/10"
                )}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
