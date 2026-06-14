import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@lumiere.com");
  const [password, setPassword] = useState("admin");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/kanban" });
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate({ to: "/kanban" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand side */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-stone-100 via-background to-champagne-soft/40">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, var(--champagne) 0, transparent 40%), radial-gradient(circle at 80% 80%, var(--champagne) 0, transparent 40%)",
        }} />
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-champagne to-champagne-soft flex items-center justify-center shadow-sm">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl text-foreground">Lumière</span>
          </div>
          <div className="space-y-4">
            <h1 className="font-display text-5xl leading-tight text-foreground">
              A excelência<br />no cuidado<br />
              <span className="italic text-primary">com cada cliente.</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              O sistema de gestão pensado para clínicas de estética que entregam experiência de luxo.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            © Lumière CRM
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Bem-vinda de volta</p>
            <h2 className="font-display text-3xl text-foreground">Acesse seu painel</h2>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais para continuar.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@clinica.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password" type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full h-11">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>

          <div className="rounded-xl bg-muted/60 border border-border p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Credenciais demo</p>
            <div className="text-xs text-foreground/80 space-y-1 font-mono">
              <div>admin@lumiere.com / admin</div>
              <div>atendente@lumiere.com / atendente</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
