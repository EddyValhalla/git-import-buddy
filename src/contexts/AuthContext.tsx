import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "lumiere.auth.user";

const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  "admin@lumiere.com": {
    password: "admin",
    user: { id: "f1", nome: "Isabella Moreau", email: "admin@lumiere.com", role: "admin" },
  },
  "atendente@lumiere.com": {
    password: "atendente",
    user: { id: "f2", nome: "Camila Duarte", email: "atendente@lumiere.com", role: "atendente" },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const entry = MOCK_USERS[email.toLowerCase().trim()];
    if (!entry || entry.password !== password) {
      throw new Error("Credenciais inválidas.");
    }
    setUser(entry.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry.user));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve estar dentro de AuthProvider");
  return ctx;
}
