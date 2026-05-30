import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Cpu,
  Play,
  TrendingUp,
  MessageSquare,
  FileText,
  Shield,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Digital Twin", href: "/digital-twin", icon: Cpu },
    { name: "Simulation", href: "/simulation", icon: Play },
    { name: "Predictions", href: "/predictions", icon: TrendingUp },
    { name: "AI Copilot", href: "/copilot", icon: MessageSquare },
    { name: "Reports", href: "/reports", icon: FileText },
  ];

  if (user?.role === "admin") {
    navItems.push({ name: "Admin", href: "/admin", icon: Shield });
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
            <div className="h-3 w-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(0,212,255,0.8)]" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">TwinMind<span className="text-primary">AI</span></span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer group",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-primary drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="font-medium text-sm">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex flex-col truncate">
            <span className="text-xs font-medium text-foreground truncate">{user?.email}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{user?.role}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Log out"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
