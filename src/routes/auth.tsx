import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Entrar — Lumière CRM" },
      { name: "description", content: "Acesse seu painel Lumière para gerenciar sua clínica de estética." },
    ],
  }),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      toast.success("Bem-vinda de volta!");
      navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha no login";
      toast.error(
        msg.includes("Invalid login") ? "E-mail ou senha inválidos." : msg,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { nome: nome.trim() },
        },
      });
      if (error) throw error;
      toast.success("Conta criada! Você já está logada.");
      navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao criar conta";
      toast.error(
        msg.includes("already registered") ? "Este e-mail já está cadastrado." : msg,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-stone-100 via-background to-champagne-soft/40">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--champagne) 0, transparent 40%), radial-gradient(circle at 80% 80%, var(--champagne) 0, transparent 40%)",
          }}
        />
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
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">© Lumière CRM</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
              {tab === "signin" ? "Bem-vinda de volta" : "Crie sua conta"}
            </p>
            <h2 className="font-display text-3xl text-foreground">
              {tab === "signin" ? "Acesse seu painel" : "Comece agora"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tab === "signin"
                ? "Entre com suas credenciais para continuar."
                : "Cadastre-se para gerenciar sua clínica."}
            </p>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={onSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email-in">E-mail</Label>
                  <Input
                    id="email-in"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@clinica.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-in">Senha</Label>
                  <Input
                    id="pw-in"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-11">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={onSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="nome-up">Nome</Label>
                  <Input
                    id="nome-up"
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-up">E-mail</Label>
                  <Input
                    id="email-up"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@clinica.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-up">Senha</Label>
                  <Input
                    id="pw-up"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-11">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
