import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/lib/types";
import { AppShell } from "./AppShell";

export function ProtectedLayout({
  children,
  requireRole,
}: {
  children: ReactNode;
  requireRole?: Role[];
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (requireRole && !requireRole.includes(user.role)) {
      navigate({ to: "/kanban" });
    }
  }, [user, loading, requireRole, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground tracking-wider uppercase">Carregando…</div>
      </div>
    );
  }
  if (requireRole && !requireRole.includes(user.role)) return null;

  return <AppShell>{children}</AppShell>;
}
