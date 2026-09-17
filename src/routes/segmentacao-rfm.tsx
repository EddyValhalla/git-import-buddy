import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useRFMSegmentacao } from "@/lib/store";
import type { RFMSegmento, RFMSegmentacao } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Users,
  TrendingUp,
  MessageCircle,
  Phone,
  RefreshCw,
  ChevronDown,
  Star,
  AlertTriangle,
  XCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const Route = createFileRoute("/segmentacao-rfm")({
  head: () => ({
    meta: [
      { title: "Segmentação RFM | Lumière CRM" },
      { name: "description", content: "Segmentação de clientes por Recência, Frequência e Valor Monetário." },
    ],
  }),
  component: () => (
    <ProtectedLayout>
      <SegmentacaoRFMPage />
    </ProtectedLayout>
  ),
});

// ── Configuração visual dos segmentos ──────────────────────────────────────────
const SEGMENTO_CONFIG: Record<
  RFMSegmento,
  { label: string; cor: string; bg: string; bordas: string; icon: React.ReactNode; pizza: string }
> = {
  OURO: {
    label: "Ouro",
    cor: "text-amber-700",
    bg: "bg-amber-50",
    bordas: "border-amber-300",
    icon: <Trophy className="h-3.5 w-3.5" />,
    pizza: "#f59e0b",
  },
  PRATA: {
    label: "Prata",
    cor: "text-slate-700",
    bg: "bg-slate-100",
    bordas: "border-slate-300",
    icon: <Star className="h-3.5 w-3.5" />,
    pizza: "#94a3b8",
  },
  EM_RISCO: {
    label: "Em Risco",
    cor: "text-orange-700",
    bg: "bg-orange-50",
    bordas: "border-orange-300",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    pizza: "#f97316",
  },
  PERDIDA: {
    label: "Perdida",
    cor: "text-rose-700",
    bg: "bg-rose-50",
    bordas: "border-rose-300",
    icon: <XCircle className="h-3.5 w-3.5" />,
    pizza: "#f43f5e",
  },
  SEM_COMPRA: {
    label: "Sem Compra",
    cor: "text-gray-500",
    bg: "bg-gray-50",
    bordas: "border-gray-200",
    icon: <Users className="h-3.5 w-3.5" />,
    pizza: "#d1d5db",
  },
};

function getSegmentoConfig(seg: string | null) {
  const norm = (seg ?? "SEM_COMPRA").trim().toUpperCase() as RFMSegmento;
  return { seg: norm, cfg: SEGMENTO_CONFIG[norm] ?? SEGMENTO_CONFIG["SEM_COMPRA"] };
}

function BadgeSegmento({ segmento }: { segmento: string | null }) {
  const { cfg } = getSegmentoConfig(segmento);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
        cfg.cor, cfg.bg, cfg.bordas
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/** Skeleton de linha de tabela */
function SkeletonRow() {
  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-4 px-5 py-3.5 border-b border-border/60 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded" />
      ))}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
function SegmentacaoRFMPage() {
  const { data, loading, error, refetch } = useRFMSegmentacao();
  const [filtroSegmento, setFiltroSegmento] = useState<string>("todos");

  // Filtragem por segmento
  const filtrados = useMemo(() => {
    if (filtroSegmento === "todos") return data;
    return data.filter((c) => {
      const { seg } = getSegmentoConfig(c.rfm_segmento);
      return seg === filtroSegmento;
    });
  }, [data, filtroSegmento]);

  // Dados para o gráfico de pizza
  const pizzaData = useMemo(() => {
    const contagem: Partial<Record<RFMSegmento, number>> = {};
    for (const c of data) {
      const { seg } = getSegmentoConfig(c.rfm_segmento);
      contagem[seg] = (contagem[seg] ?? 0) + 1;
    }
    return Object.entries(contagem).map(([seg, value]) => {
      const { cfg } = getSegmentoConfig(seg);
      return {
        name: cfg.label,
        value,
        cor: cfg.pizza,
      };
    });
  }, [data]);

  const formatBRL = (v: number | null) =>
    v == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const formatDias = (d: number | null) => (d == null ? "—" : `${d}d`);

  const linkWhatsApp = (tel: string) => {
    const digits = tel.replace(/\D/g, "");
    return `https://wa.me/${digits}`;
  };

  return (
    <div className="p-10 space-y-8 max-w-[1400px]">
      {/* Header */}
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-medium">
            CRM Estratégico
          </p>
          <h1 className="font-display text-4xl text-foreground mt-1">Segmentação RFM</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Recência · Frequência · Valor Monetário — {data.length} clientes mapeados
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void refetch()}
          disabled={loading}
          className="gap-2"
          id="btn-rfm-refresh"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Atualizar
        </Button>
      </header>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-5 py-4 text-sm text-rose-700">
          Erro ao carregar dados: {error}
        </div>
      )}

      {/* Cards de resumo + Gráfico de pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cards de segmentos */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {loading ? (
            <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground text-sm animate-pulse">
              Carregando segmentos...
            </div>
          ) : (
            (Object.entries(SEGMENTO_CONFIG) as [RFMSegmento, typeof SEGMENTO_CONFIG[RFMSegmento]])
              .map(([seg, cfg]) => {
                const count = data.filter((c) => getSegmentoConfig(c.rfm_segmento).seg === seg).length;
                return (
                  <button
                    key={seg}
                    id={`card-seg-${seg}`}
                    onClick={() => setFiltroSegmento(filtroSegmento === seg ? "todos" : seg)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all hover:shadow-md",
                      filtroSegmento === seg
                        ? `${cfg.bg} ${cfg.bordas} shadow-sm`
                        : "bg-card border-border hover:border-primary/30"
                    )}
                  >
                    <div className={cn("flex items-center gap-1.5 mb-2", cfg.cor)}>
                      {cfg.icon}
                      <span className="text-[11px] font-semibold uppercase tracking-wide">{cfg.label}</span>
                    </div>
                    <p className={cn("text-3xl font-bold", cfg.cor)}>{count}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">clientes</p>
                  </button>
                );
              })
          )}
        </div>

        {/* Pizza chart */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
            Distribuição
          </p>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm animate-pulse">
              Carregando…
            </div>
          ) : pizzaData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Nenhum dado ainda
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pizzaData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {pizzaData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`${v} clientes`, ""]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filtroSegmento} onValueChange={setFiltroSegmento}>
          <SelectTrigger className="w-48" id="select-filtro-segmento">
            <SelectValue placeholder="Filtrar segmento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os segmentos</SelectItem>
            {(Object.entries(SEGMENTO_CONFIG) as [RFMSegmento, typeof SEGMENTO_CONFIG[RFMSegmento]][]).map(
              ([seg, cfg]) => (
                <SelectItem key={seg} value={seg}>
                  {cfg.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtrados.length} cliente{filtrados.length !== 1 ? "s" : ""}
          {filtroSegmento !== "todos" ? ` no segmento ${SEGMENTO_CONFIG[filtroSegmento as RFMSegmento]?.label}` : ""}
        </span>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header da tabela */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-4 px-5 py-3 bg-muted/40 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          <span>Cliente</span>
          <span className="text-center">Recência</span>
          <span className="text-center">Frequência</span>
          <span className="text-center">Ticket Médio</span>
          <span className="text-center">Segmento</span>
          <span className="text-center">Ação</span>
        </div>

        {/* Linhas */}
        {loading ? (
          <>
            {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
          </>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum cliente neste segmento ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">
              O segmento é calculado automaticamente após procedimentos concluídos.
            </p>
          </div>
        ) : (
          filtrados.map((cliente, idx) => (
            <ClienteRow
              key={cliente.id}
              cliente={cliente}
              idx={idx}
              total={filtrados.length}
              formatBRL={formatBRL}
              formatDias={formatDias}
              linkWhatsApp={linkWhatsApp}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Linha da tabela ────────────────────────────────────────────────────────────
function ClienteRow({
  cliente,
  idx,
  total,
  formatBRL,
  formatDias,
  linkWhatsApp,
}: {
  cliente: RFMSegmentacao;
  idx: number;
  total: number;
  formatBRL: (v: number | null) => string;
  formatDias: (d: number | null) => string;
  linkWhatsApp: (tel: string) => string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-muted/20",
        idx !== total - 1 && "border-b border-border/60"
      )}
    >
      {/* Nome + telefone */}
      <div>
        <p className="text-sm font-medium text-foreground truncate">{cliente.nome}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Phone className="h-3 w-3" />
          {cliente.telefone}
        </p>
      </div>

      {/* Recência */}
      <div className="text-center">
        <p className="text-sm font-mono font-semibold text-foreground">
          {formatDias(cliente.dias_sem_compra)}
        </p>
        <p className="text-[10px] text-muted-foreground">sem comprar</p>
      </div>

      {/* Frequência */}
      <div className="text-center">
        <p className="text-sm font-mono font-semibold text-foreground">
          {cliente.qtd_procedimentos ?? 0}
        </p>
        <p className="text-[10px] text-muted-foreground">procedimentos</p>
      </div>

      {/* Ticket médio */}
      <div className="text-center">
        <p className="text-sm font-mono font-semibold text-foreground">
          {formatBRL(cliente.ticket_medio)}
        </p>
      </div>

      {/* Segmento */}
      <div className="flex justify-center">
        <BadgeSegmento segmento={cliente.rfm_segmento} />
      </div>

      {/* Botão WhatsApp */}
      <div className="flex justify-center">
        <a
          href={linkWhatsApp(cliente.telefone)}
          target="_blank"
          rel="noopener noreferrer"
          id={`btn-whatsapp-${cliente.id}`}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium",
            "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
          )}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Enviar
        </a>
      </div>
    </div>
  );
}
