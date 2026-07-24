import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/types";

interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadUser(session: Session | null): Promise<AuthUser | null> {
  if (!session?.user) return null;
  const { user } = session;

  // Fetch profile and role in parallel. Do NOT await inside onAuthStateChange
  // callback directly — but we call this from a scheduled effect, so it's fine.
  const [profileRes, rolesRes] = await Promise.all([
    supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const nome =
    profileRes.data?.nome ||
    (user.user_metadata?.nome as string | undefined) ||
    user.email?.split("@")[0] ||
    "Usuário";

  const roles = (rolesRes.data ?? []).map((r) => r.role as Role);
  const role: Role = roles.includes("admin") ? "admin" : "atendente";

  return { id: user.id, nome, email: user.email ?? "", role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async (session: Session | null) => {
    try {
      const u = await loadUser(session);
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Subscribe first so we don't miss events fired during getSession()
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      // Never make async supabase calls directly inside the callback.
      // Defer to a microtask so listener stays synchronous.
      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        return;
      }
      setTimeout(() => {
        if (!cancelled) void hydrate(session);
      }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) void hydrate(data.session);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [hydrate]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await hydrate(data.session);
  }, [hydrate]);

  const value = useMemo(
    () => ({ user, loading, logout, refresh }),
    [user, loading, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve estar dentro de AuthProvider");
  return ctx;
}
