import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useClientes, useIntervaloMedio, useReceitaRecorrente } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Users,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Target,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/diagnosticos")({
  head: () => ({
    meta: [
      { title: "Diagnósticos | Lumière CRM" },
      { name: "description", content: "Diagnósticos estratégicos: frequência de compras, intervalo médio e receita recorrente." },
    ],
  }),
  component: () => (
    <ProtectedLayout>
      <DiagnosticosPage />
    </ProtectedLayout>
  ),
});

// ── Formatadores ───────────────────────────────────────────────────────────────
const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const fmtMes = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
};

// ── Tooltip personalizado ──────────────────────────────────────────────────────
function TooltipBRL({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-xs min-w-[160px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </span>
          <span className="font-semibold">{fmtBRL(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
function DiagnosticosPage() {
  const clientes = useClientes();
  const { data: intervaloData, loading: intervaloLoading } = useIntervaloMedio();
  const { data: receitaData, loading: receitaLoading } = useReceitaRecorrente();

  // Meta configurável de receita recorrente
  const [metaAtual, setMetaAtual] = useState(40);
  const [metaAlvo, setMetaAlvo] = useState(70);

  // ── Card 1: Clientes por grupo de compras ─────────────────────────────────
  const gruposCompra = useMemo(() => {
    const grupos = { "1 compra": 0, "2 compras": 0, "3 compras": 0, "4+ compras": 0 };
    for (const c of clientes) {
      const qtd = c.qtd_procedimentos ?? 0;
      if (qtd === 1) grupos["1 compra"]++;
      else if (qtd === 2) grupos["2 compras"]++;
      else if (qtd === 3) grupos["3 compras"]++;
      else if (qtd >= 4) grupos["4+ compras"]++;
    }
    return Object.entries(grupos).map(([name, value]) => ({ name, value }));
  }, [clientes]);

  // ── Card 3: Receita recorrente vs nova (últimos 6 meses) ─────────────────
  const receitaChartData = useMemo(() =>
    [...receitaData]
      .slice(0, 6)
      .reverse()
      .map((r) => ({
        mes: fmtMes(r.mes),
        "Nova": r.receita_nova ?? 0,
        "Recorrente": r.receita_recorrente ?? 0,
      })),
    [receitaData]
  );

  // % atual de receita recorrente (último mês)
  const pctRecorrenteAtual = useMemo(() => {
    const ultimo = receitaData[0];
    if (!ultimo || !ultimo.receita_total) return 0;
    return Math.round(((ultimo.receita_recorrente ?? 0) / ultimo.receita_total) * 100);
  }, [receitaData]);

  const progressoMeta = Math.min(100, Math.round(((pctRecorrenteAtual - metaAtual) / (metaAlvo - metaAtual)) * 100));

  return (
    <div className="p-10 space-y-8 max-w-[1400px]">
      {/* Header */}
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-medium">CRM Estratégico</p>
        <h1 className="font-display text-4xl text-foreground mt-1">Diagnósticos</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Análise estratégica da base de clientes e receita
        </p>
      </header>

      {/* ── Card 1: Clientes por grupo de compras ─────────────────────────── */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Clientes por Grupo de Compras</h2>
            <p className="text-xs text-muted-foreground">Distribuição pelo número de procedimentos realizados</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de barras */}
          <div className="lg:col-span-2 h-52">
            {clientes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm animate-pulse">
                Carregando…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gruposCompra} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="value" name="Clientes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tabela auxiliar */}
          <div className="space-y-2">
            {gruposCompra.map(({ name, value }) => {
              const pct = clientes.length > 0 ? Math.round((value / clientes.length) * 100) : 0;
              return (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-semibold text-foreground w-6 text-right">{value}</span>
                    <span className="text-muted-foreground text-[10px] w-8">({pct}%)</span>
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-border flex justify-between text-xs">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-foreground">{clientes.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Card 2: Intervalo médio por procedimento ───────────────────────── */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-xl bg-champagne-soft/60 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary/80" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Intervalo Médio por Procedimento</h2>
            <p className="text-xs text-muted-foreground">Quantos dias, em média, o cliente espera para repetir o procedimento</p>
          </div>
        </div>

        {intervaloLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : intervaloData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              Dados insuficientes — é necessário que clientes repitam procedimentos.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 px-4 py-2.5 bg-muted/40 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              <span>Procedimento</span>
              <span className="text-center">Realizações</span>
              <span className="text-center">Intervalo Médio</span>
            </div>
            {intervaloData.map((row, idx) => (
              <div
                key={row.procedimento_id}
                className={cn(
                  "grid grid-cols-[2fr_1fr_1fr] gap-4 px-4 py-3 items-center hover:bg-muted/20 transition-colors",
                  idx !== intervaloData.length - 1 && "border-b border-border/60"
                )}
              >
                <p className="text-sm font-medium text-foreground truncate">{row.procedimento_nome}</p>
                <p className="text-sm text-center text-muted-foreground">{row.total_realizados}x</p>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-sm font-bold text-foreground font-mono">
                    {row.intervalo_medio_dias ?? "—"}
                  </span>
                  {row.intervalo_medio_dias && (
                    <span className="text-[10px] text-muted-foreground">dias</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Card 3: Receita Recorrente vs Nova ─────────────────────────────── */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Receita Recorrente vs Nova</h2>
              <p className="text-xs text-muted-foreground">Clientes que retornam vs primeiras compras</p>
            </div>
          </div>

          {/* Meta configurável */}
          <div className="flex items-center gap-4 bg-muted/40 rounded-xl px-4 py-3 border border-border">
            <Target className="h-4 w-4 text-primary shrink-0" />
            <div className="flex items-center gap-2 text-xs">
              <Label className="text-muted-foreground shrink-0" htmlFor="input-meta-atual">De</Label>
              <Input
                id="input-meta-atual"
                type="number"
                min={0}
                max={100}
                value={metaAtual}
                onChange={(e) => setMetaAtual(Number(e.target.value))}
                className="w-14 h-7 text-xs text-center"
              />
              <span className="text-muted-foreground">%</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <Label className="text-muted-foreground shrink-0" htmlFor="input-meta-alvo">para</Label>
              <Input
                id="input-meta-alvo"
                type="number"
                min={0}
                max={100}
                value={metaAlvo}
                onChange={(e) => setMetaAlvo(Number(e.target.value))}
                className="w-14 h-7 text-xs text-center"
              />
              <span className="text-muted-foreground">% recorrente</span>
            </div>
          </div>
        </div>

        {/* Progress bar da meta */}
        <div className="mb-5 p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Progresso para a meta</span>
            <span className="text-xs font-bold text-foreground">
              {pctRecorrenteAtual}% atual → meta: {metaAlvo}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-border overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progressoMeta >= 100 ? "bg-emerald-500" : progressoMeta >= 50 ? "bg-primary" : "bg-amber-400"
              )}
              style={{ width: `${Math.max(0, progressoMeta)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {progressoMeta >= 100
              ? "✅ Meta atingida!"
              : `Faltam ${metaAlvo - pctRecorrenteAtual}% para atingir a meta de receita recorrente.`}
          </p>
        </div>

        {/* Gráfico de área */}
        {receitaLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm animate-pulse">
            Carregando…
          </div>
        ) : receitaChartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              Dados ainda não disponíveis. Complete agendamentos para gerar métricas de receita.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={receitaChartData} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
              <defs>
                <linearGradient id="gradNova" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRecorrente" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `R$${Math.round(v / 1000)}k`}
              />
              <Tooltip content={<TooltipBRL />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="Recorrente"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gradRecorrente)"
              />
              <Area
                type="monotone"
                dataKey="Nova"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#gradNova)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}
