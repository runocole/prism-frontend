import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  Send,
  ClipboardList,
  LogOut,
  FolderOpen,
  Ban,
  Filter,

} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUser, clearAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import type { AuthUser } from "@/lib/auth";



const nav = [
  { to: "/hr/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/hr/jobs", label: "Jobs", icon: Briefcase },
  { to: "/hr/screening", label: "Screening", icon: Filter },
  { to: "/hr/tests", label: "Tests", icon: FolderOpen },
  { to: "/hr/invites", label: "Invites", icon: Send },
  { to: "/hr/results", label: "Results", icon: ClipboardList },
  { to: "/hr/blacklist", label: "Blacklist", icon: Ban },
] as const;

export function HrLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(getUser);

  useEffect(() => {
    // Read user from localStorage on mount
    const u = getUser();
    if (!u) {
      // Not logged in — redirect to login
      navigate({ to: "/hr/login" });
    } else {
      setUser(u);
    }
  }, []);

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refresh_token") ?? "";
    try {
      // Best-effort server logout — don't block UI on failure
      await fetch(`${import.meta.env.VITE_API_URL ?? "https://pas-backend.oticgs.com/api/v1"}/auth/logout/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
    } finally {
      clearAuth();
      navigate({ to: "/hr/login" });
    }
  };

  // Derive initials from user name for the avatar
  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase()
    : "…";

  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.email
    : "Loading…";

  const displayRole = user?.role === "hr" ? "HR" : user?.role === "reviewer" ? "Reviewer" : "";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="flex w-64 flex-col bg-navy-gradient text-sidebar-foreground">
        <Link to="/hr/dashboard" className="flex items-center gap-2 px-6 py-6">
          <img src="/favicon.png" alt="OTIC" className="h-8 w-auto" />
          <div>
            <div className="font-display text-lg font-semibold leading-none">OTIC</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
              Proctored Assessment
            </div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/hr/tests" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-foreground text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-foreground/15 text-xs font-medium">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{displayName}</div>
              <div className="truncate text-xs text-sidebar-foreground/60">{displayRole}</div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
