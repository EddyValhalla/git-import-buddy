import { useMemo } from "react";
import { TrendingUp, CalendarCheck, Users, Bot, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAgendamentos } from "@/lib/store";
import { useProcedimentos } from "@/lib/store";

interface RelatorioModalProps {
  open: boolean;
  onClose: () => void;
}

export function RelatorioModal({ open, onClose }: RelatorioModalProps) {
  const agendamentos = useAgendamentos();
  const procedimentos = useProcedimentos();

  const relatorio = useMemo(() => {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Agendamentos do mês atual (considerando updated_at ou data_hora_inicio)
    const doMes = agendamentos.filter((a) => {
      const ref = a.data_hora_inicio ?? a.updated_at;
      if (!ref) return false;
      const d = new Date(ref);
      return d >= inicioMes && d <= fimMes;
    });

    // Concluídos do mês
    const concluidos = doMes.filter((a) => a.status_kanban === "concluido");
    const agendados = doMes.filter((a) => a.status_kanban === "agendado");

    // Faturamento estimado (soma dos valores dos procedimentos concluídos)
    const faturamento = concluidos.reduce((sum, a) => {
      const proc = procedimentos.find((p) => p.id === a.procedimento_id);
      return sum + (proc?.valor_sugerido ?? 0);
    }, 0);

    // Total de agendamentos (agendados + concluídos)
    const totalAgendamentos = agendados.length + concluidos.length;

    // Taxa de conversão da IA
    const agendadosPorIA = agendamentos.filter((a) => a.agendado_por_ia === true).length;
    const totalLeads = agendamentos.length;
    const taxaConversaoIA =
      totalLeads > 0 ? Math.round((agendadosPorIA / totalLeads) * 100) : 0;

    // Por tipo de atendimento
    const atendimentoIA = agendamentos.filter((a) => a.tipo_atendimento === "ia").length;
    const atendimentoHumano = agendamentos.filter((a) => a.tipo_atendimento === "humano").length;

    return {
      faturamento,
      totalAgendamentos,
      agendadosPorIA,
      taxaConversaoIA,
      atendimentoIA,
      atendimentoHumano,
      totalConcluidos: concluidos.length,
      mes: now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
  }, [agendamentos, procedimentos]);

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Relatório Mensal
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground capitalize mt-1">
            {relatorio.mes}
          </p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Faturamento */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Faturamento Estimado
              </p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {formatCurrency(relatorio.faturamento)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {relatorio.totalConcluidos} procedimento{relatorio.totalConcluidos !== 1 ? "s" : ""} concluído{relatorio.totalConcluidos !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Grid de métricas */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total de agendamentos */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="h-4 w-4 text-primary/70" />
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Agendamentos
                </p>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {relatorio.totalAgendamentos}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                no mês atual
              </p>
            </div>

            {/* Conversão IA */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4 text-primary/70" />
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Conversão IA
                </p>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {relatorio.taxaConversaoIA}
                <span className="text-lg font-medium text-muted-foreground">%</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {relatorio.agendadosPorIA} agendados pela IA
              </p>
            </div>
          </div>

          {/* Tipo de atendimento */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary/70" />
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Tipo de Atendimento — Total do período
              </p>
            </div>
            <div className="space-y-2">
              {/* IA */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground w-24 shrink-0">
                  Agente IA
                </span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width:
                        relatorio.atendimentoIA + relatorio.atendimentoHumano > 0
                          ? `${Math.round(
                              (relatorio.atendimentoIA /
                                (relatorio.atendimentoIA + relatorio.atendimentoHumano)) *
                                100
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground w-6 text-right shrink-0">
                  {relatorio.atendimentoIA}
                </span>
              </div>
              {/* Humano */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground w-24 shrink-0">
                  Humano
                </span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-champagne transition-all"
                    style={{
                      width:
                        relatorio.atendimentoIA + relatorio.atendimentoHumano > 0
                          ? `${Math.round(
                              (relatorio.atendimentoHumano /
                                (relatorio.atendimentoIA + relatorio.atendimentoHumano)) *
                                100
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground w-6 text-right shrink-0">
                  {relatorio.atendimentoHumano}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
