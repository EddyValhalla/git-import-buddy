import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  KanbanSquare,
  CalendarDays,
  MessagesSquare,
  Settings,
  Wallet,
  LogOut,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles: Role[];
  /** Se true, só ativa o estilo "ativo" quando a rota é exatamente este path */
  exact?: boolean;
}

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, roles: ["admin", "atendente"], exact: true },
  { to: "/kanban", label: "Kanban", icon: <KanbanSquare className="h-4 w-4" />, roles: ["admin", "atendente"] },
  { to: "/agenda", label: "Agenda", icon: <CalendarDays className="h-4 w-4" />, roles: ["admin", "atendente"] },
  { to: "/atendimento", label: "Atendimento", icon: <MessagesSquare className="h-4 w-4" />, roles: ["admin", "atendente"] },
  { to: "/financeiro", label: "Financeiro", icon: <Wallet className="h-4 w-4" />, roles: ["admin"] },
  { to: "/configuracoes", label: "Configurações", icon: <Settings className="h-4 w-4" />, roles: ["admin"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const items = NAV.filter((i) => user && i.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="px-6 py-7 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-champagne to-champagne-soft flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-xl leading-none text-sidebar-foreground">Lumière</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                Estética Premium
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {items.map((item) => {
          const active = item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <span className={cn(active ? "text-primary" : "")}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="px-3 py-2 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-accent-foreground">
              {user?.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-sidebar-foreground truncate">{user?.nome}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{user?.role}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
