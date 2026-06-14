import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useAgendamentos, useClientes, useProcedimentos, useFuncionarios } from "@/lib/store";
import { RelatorioModal } from "@/features/dashboard/RelatorioModal";
import {
  Users,
  CalendarCheck,
  Bot,
  TrendingUp,
  MessageCircle,
  Instagram,
  Clock,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <ProtectedLayout>
      <Dashboard />
    </ProtectedLayout>
  );
}

const STATUS_AGENDA_CONFIG = {
  confirmado: {
    label: "Confirmado",
    icon: CheckCircle2,
    className: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
  },
  pendente: {
    label: "Pendente",
    icon: Circle,
    className: "text-amber-500",
    bg: "bg-amber-50 border-amber-200",
  },
  reagendar: {
    label: "Reagendar",
    icon: AlertCircle,
    className: "text-rose-500",
    bg: "bg-rose-50 border-rose-200",
  },
} as const;

function Dashboard() {
  const agendamentos = useAgendamentos();
  const clientes = useClientes();
  const procedimentos = useProcedimentos();
  const funcionarios = useFuncionarios();
  const [relatorioOpen, setRelatorioOpen] = useState(false);

  // Hoje
  const hoje = new Date();
  const ehHoje = (d: Date) =>
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate();

  const metricas = useMemo(() => {
    // Clientes atendidos hoje (agendamentos com data_hora_inicio hoje)
    const atendidosHoje = agendamentos.filter(
      (a) => a.data_hora_inicio && ehHoje(new Date(a.data_hora_inicio))
    );

    // Origem dos leads
    const origWA = clientes.filter((c) => c.origem === "whatsapp").length;
    const origIG = clientes.filter((c) => c.origem === "instagram").length;
    const origPresencial = clientes.filter((c) => c.origem === "presencial").length;
    const totalOrigem = origWA + origIG + origPresencial || 1;

    // Tipo de atendimento (global)
    const tipoIA = agendamentos.filter((a) => a.tipo_atendimento === "ia").length;
    const tipoHumano = agendamentos.filter((a) => a.tipo_atendimento === "humano").length;
    const totalTipo = tipoIA + tipoHumano || 1;

    // Conversão IA
    const agendadosPorIA = agendamentos.filter((a) => a.agendado_por_ia === true).length;

    return {
      atendidosHoje: atendidosHoje.length,
      origWA,
      origIG,
      origPresencial,
      pctWA: Math.round((origWA / totalOrigem) * 100),
      pctIG: Math.round((origIG / totalOrigem) * 100),
      pctPresencial: Math.round((origPresencial / totalOrigem) * 100),
      tipoIA,
      tipoHumano,
      pctIA: Math.round((tipoIA / totalTipo) * 100),
      pctHumano: Math.round((tipoHumano / totalTipo) * 100),
      agendadosPorIA,
    };
  }, [agendamentos, clientes]);

  // Próximos agendamentos do dia (com hora, ordenados)
  const proximosHoje = useMemo(() => {
    return agendamentos
      .filter(
        (a) =>
          a.data_hora_inicio &&
          ehHoje(new Date(a.data_hora_inicio)) &&
          (a.status_kanban === "agendado" || a.status_kanban === "concluido")
      )
      .sort(
        (a, b) =>
          new Date(a.data_hora_inicio!).getTime() -
          new Date(b.data_hora_inicio!).getTime()
      );
  }, [agendamentos]);

  const formatHour = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const getProcNome = (id: string) =>
    procedimentos.find((p) => p.id === id)?.nome ?? "—";

  return (
    <div className="p-10 space-y-8 max-w-[1400px]">
      {/* Header */}
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-medium">
            Visão Geral
          </p>
          <h1 className="font-display text-4xl text-foreground mt-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {hoje.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Button
          onClick={() => setRelatorioOpen(true)}
          className="shadow-md flex items-center gap-2 pr-5 bg-gradient-to-r from-primary to-primary/80"
        >
          <FileText className="h-4 w-4" />
          <span>Gerar Relatório Mensal</span>
        </Button>
      </header>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Atendidos Hoje */}
        <MetricCard
          title="Atendidos Hoje"
          icon={<Users className="h-5 w-5" />}
          accent="primary"
        >
          <p className="text-5xl font-bold text-foreground leading-none mt-2">
            {metricas.atendidosHoje}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            clientes com sessão hoje
          </p>
        </MetricCard>

        {/* Card 2: Origem do Lead */}
        <MetricCard
          title="Origem do Lead"
          icon={<MessageCircle className="h-5 w-5" />}
          accent="champagne"
        >
          <div className="mt-3 space-y-2.5">
            <LeadOrigemBar
              icon={<MessageCircle className="h-3.5 w-3.5 text-emerald-500" />}
              label="WhatsApp"
              count={metricas.origWA}
              pct={metricas.pctWA}
              color="bg-emerald-400"
            />
            <LeadOrigemBar
              icon={<Instagram className="h-3.5 w-3.5 text-rose-400" />}
              label="Instagram"
              count={metricas.origIG}
              pct={metricas.pctIG}
              color="bg-gradient-to-r from-rose-400 to-purple-400"
            />
            <LeadOrigemBar
              icon={<MapPin className="h-3.5 w-3.5 text-blue-500" />}
              label="Presencial"
              count={metricas.origPresencial}
              pct={metricas.pctPresencial}
              color="bg-blue-400"
            />
          </div>
        </MetricCard>

        {/* Card 3: Tipo de Atendimento */}
        <MetricCard
          title="Tipo de Atendimento"
          icon={<Bot className="h-5 w-5" />}
          accent="primary"
        >
          <div className="mt-3 space-y-2.5">
            <LeadOrigemBar
              icon={<Bot className="h-3.5 w-3.5 text-primary" />}
              label="Agente IA"
              count={metricas.tipoIA}
              pct={metricas.pctIA}
              color="bg-primary"
            />
            <LeadOrigemBar
              icon={<Users className="h-3.5 w-3.5 text-slate-400" />}
              label="Humano"
              count={metricas.tipoHumano}
              pct={metricas.pctHumano}
              color="bg-slate-400"
            />
          </div>
        </MetricCard>

        {/* Card 4: Conversão IA */}
        <MetricCard
          title="Conversão da IA"
          icon={<Sparkles className="h-5 w-5" />}
          accent="champagne"
        >
          <p className="text-5xl font-bold text-foreground leading-none mt-2">
            {metricas.agendadosPorIA}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            agendamentos feitos exclusivamente pela IA
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width:
                  agendamentos.length > 0
                    ? `${Math.min(
                        100,
                        Math.round((metricas.agendadosPorIA / agendamentos.length) * 100)
                      )}%`
                    : "0%",
              }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {agendamentos.length > 0
              ? `${Math.round((metricas.agendadosPorIA / agendamentos.length) * 100)}% do total de leads`
              : "Nenhum lead ainda"}
          </p>
        </MetricCard>
      </div>

      {/* PRÓXIMOS AGENDAMENTOS DO DIA */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck className="h-4.5 w-4.5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Próximos Agendamentos do Dia
          </h2>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
            {proximosHoje.length}
          </span>
        </div>

        {proximosHoje.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-border text-center">
            <CalendarCheck className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum agendamento encontrado para hoje.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[80px_1fr_1fr_120px_120px] gap-4 px-5 py-3 bg-muted/40 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              <span>Hora</span>
              <span>Paciente</span>
              <span>Procedimento</span>
              <span>Profissional</span>
              <span className="text-center">Status</span>
            </div>

            {proximosHoje.map((a, idx) => {
              const statusCfg =
                STATUS_AGENDA_CONFIG[a.status_agenda ?? "pendente"];
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={a.id}
                  className={cn(
                    "grid grid-cols-[80px_1fr_1fr_120px_120px] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-muted/30",
                    idx !== proximosHoje.length - 1 && "border-b border-border/60"
                  )}
                >
                  {/* Hora */}
                  <div className="flex items-center gap-1.5 text-sm font-mono font-semibold text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatHour(a.data_hora_inicio!)}
                  </div>

                  {/* Paciente */}
                  <div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {a.cliente_nome}
                    </p>
                    {a.agendado_por_ia && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-primary/80 font-medium mt-0.5">
                        <Sparkles className="h-2.5 w-2.5" />
                        IA
                      </span>
                    )}
                  </div>

                  {/* Procedimento */}
                  <p className="text-sm text-muted-foreground truncate">
                    {a.procedimento_nome ?? getProcNome(a.procedimento_id)}
                  </p>

                  {/* Profissional */}
                  <p className="text-xs text-muted-foreground truncate">
                    {(() => {
                      const profIdOrName = a.profissional_responsavel || a.funcionario_id;
                      if (!profIdOrName) return "—";
                      const f = funcionarios.find((func) => func.id === profIdOrName);
                      return f?.nome ?? profIdOrName;
                    })()}
                  </p>

                  {/* Status */}
                  <div className="flex justify-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border",
                        statusCfg.bg,
                        statusCfg.className
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de Relatório */}
      <RelatorioModal open={relatorioOpen} onClose={() => setRelatorioOpen(false)} />
    </div>
  );
}

// ─── Sub-componentes ───────────────────────────────────────────

function MetricCard({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent: "primary" | "champagne";
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {title}
        </p>
        <div
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center",
            accent === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-champagne-soft/60 text-primary/80"
          )}
        >
          {icon}
        </div>
      </div>
      {children}
    </div>
  );
}

function LeadOrigemBar({
  icon,
  label,
  count,
  pct,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
          {icon}
          {label}
        </span>
        <span className="font-semibold text-foreground">
          {count}{" "}
          <span className="text-muted-foreground font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
