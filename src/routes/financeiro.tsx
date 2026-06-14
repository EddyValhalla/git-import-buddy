import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useAgendamentos, useFuncionarios, useProcedimentos, crmStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Wallet,
  Snowflake,
  Send,
  DollarSign,
  Users,
  Percent,
  Coins,
  Settings,
  AreaChart as ChartIcon
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export const Route = createFileRoute("/financeiro")({
  component: () => (
    <ProtectedLayout requireRole={["admin"]}>
      <FinanceiroPage />
    </ProtectedLayout>
  ),
});

function FinanceiroPage() {
  const agendamentos = useAgendamentos();
  const funcionarios = useFuncionarios();
  const procedimentos = useProcedimentos();

  // State for commissions configuration dialog
  const [isComConfigOpen, setIsComConfigOpen] = useState(false);
  const [editingComValue, setEditingComValue] = useState<Record<string, number>>({});
  const [editingComTipo, setEditingComTipo] = useState<Record<string, "porcentagem" | "fixo">>({});

  // 1. Calculate general stats
  const realizados = agendamentos.filter(
    (c) => c.status_kanban === "concluido"
  );

  // Revenue is calculated by multiplying each completed procedure's count by its price
  const faturamento = realizados.reduce((acc, a) => {
    const proc = procedimentos.find((p) => p.id === a.procedimento_id);
    return acc + (proc ? proc.valor_sugerido : 1850);
  }, 0);

  // Commission is calculated dynamically per completed procedure commission settings
  const comissoesTotal = realizados.reduce((acc, a) => {
    const proc = procedimentos.find((p) => p.id === a.procedimento_id);
    if (!proc) return acc + 1850 * 0.18;
    const tipo = proc.comissao_tipo ?? "porcentagem";
    const valor = proc.comissao_valor ?? 18;
    if (tipo === "fixo") {
      return acc + valor;
    } else {
      return acc + (proc.valor_sugerido * valor) / 100;
    }
  }, 0);

  const ticketMedio = realizados.length > 0 ? Math.round(faturamento / realizados.length) : 0;

  const leadsQuentes = agendamentos.filter(
    (a) => a.status_kanban === "em_atendimento" || a.status_kanban === "agendado"
  ).length;

  const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
  const frios = agendamentos.filter(
    (c) => c.status_kanban === "em_atendimento" && c.updated_at && new Date(c.updated_at).getTime() < cutoff
  );

  // 2. Aggregate Procedure Revenue Table
  const procedureStats = procedimentos.map((proc) => {
    const count = realizados.filter((r) => r.procedimento_id === proc.id).length;
    const revenue = count * proc.valor_sugerido;
    return {
      id: proc.id,
      nome: proc.nome,
      quantidade: count,
      receita: revenue,
      valor_sugerido: proc.valor_sugerido,
    };
  });

  // 3. Aggregate Professional Commission Table
  const professionalStats = funcionarios
    .map((func) => {
      const completedSessions = realizados.filter((r) => r.funcionario_id === func.id);
      const count = completedSessions.length;
      const totalCommission = completedSessions.reduce((acc, a) => {
        const proc = procedimentos.find((p) => p.id === a.procedimento_id);
        if (!proc) return acc;
        const tipo = proc.comissao_tipo ?? "porcentagem";
        const valor = proc.comissao_valor ?? 18;
        if (tipo === "fixo") {
          return acc + valor;
        } else {
          return acc + (proc.valor_sugerido * valor) / 100;
        }
      }, 0);
      return {
        id: func.id,
        nome: func.nome,
        quantidade: count,
        comissao: totalCommission,
      };
    })
    .filter((stat) => stat.quantidade > 0);

  // Open commissions modal and prefill inputs
  const handleOpenComConfig = () => {
    const vals: Record<string, number> = {};
    const tipos: Record<string, "porcentagem" | "fixo"> = {};
    procedimentos.forEach((p) => {
      vals[p.id] = p.comissao_valor ?? 18;
      tipos[p.id] = p.comissao_tipo ?? "porcentagem";
    });
    setEditingComValue(vals);
    setEditingComTipo(tipos);
    setIsComConfigOpen(true);
  };

  // Save commissions updates
  const handleSaveComissions = () => {
    procedimentos.forEach((p) => {
      crmStore.updateProcedimento(p.id, {
        comissao_valor: Number(editingComValue[p.id] ?? 18),
        comissao_tipo: editingComTipo[p.id] ?? "porcentagem",
      });
    });
    setIsComConfigOpen(false);
    toast.success("Regras de comissões atualizadas com sucesso!");
  };

  // 6-Month Chart Data
  const chartData = [
    { name: "Dez", faturamento: 14500 },
    { name: "Jan", faturamento: 18900 },
    { name: "Fev", faturamento: 16200 },
    { name: "Mar", faturamento: 23500 },
    { name: "Abr", faturamento: 21800 },
    { name: "Mai", faturamento: faturamento > 0 ? faturamento : 29000 },
  ];

  return (
    <div className="p-10 space-y-8 pb-16">
      <header className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-medium">Financeiro</p>
          <h1 className="font-display text-4xl text-foreground mt-1">Visão Geral</h1>
        </div>
        <Button variant="outline" onClick={handleOpenComConfig} className="flex items-center gap-2 shadow-sm">
          <Settings className="h-4 w-4 text-primary" />
          <span>Configurar Comissões</span>
        </Button>
      </header>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Faturamento do Mês"
          value={`R$ ${faturamento.toLocaleString("pt-BR")}`}
          hint="+12.4% vs mês anterior"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          label="Comissões a Pagar"
          value={`R$ ${Math.round(comissoesTotal).toLocaleString("pt-BR")}`}
          hint="Fechamento do caixa técnico"
          icon={<Wallet className="h-5 w-5" />}
        />
        <MetricCard
          label="Ticket Médio"
          value={`R$ ${ticketMedio.toLocaleString("pt-BR")}`}
          hint="Gasto médio por procedimento"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <MetricCard
          label="Leads Quentes"
          value={String(leadsQuentes)}
          hint="Etapas: Interesse / Agendado"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECHARTS AREA CHART */}
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-foreground flex items-center gap-2">
                <ChartIcon className="h-4.5 w-4.5 text-primary" />
                <span>Desempenho de Faturamento</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Histórico mensal de receita bruta em R$</p>
            </div>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-success/15 text-stone-800 border border-success/35 font-semibold">
              Mensal
            </span>
          </div>

          <div className="h-[260px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c5a880" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#c5a880" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: any) => [`R$ ${value.toLocaleString("pt-BR")}`, "Faturamento"]}
                  contentStyle={{ backgroundColor: "#fff", borderColor: "#e2e8f0", borderRadius: "12px", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="faturamento"
                  stroke="#c5a880"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFaturamento)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* REVENUE BY PROCEDURE TABLE */}
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-[366px]">
          <div className="mb-4">
            <h2 className="font-display text-xl text-foreground">Receita por Procedimento</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Procedimentos realizados e faturamento</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Procedimento</TableHead>
                  <TableHead className="text-center text-xs">Qtd</TableHead>
                  <TableHead className="text-right text-xs">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procedureStats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-medium text-xs truncate max-w-[130px]">{stat.nome}</TableCell>
                    <TableCell className="text-center text-xs">{stat.quantidade}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">
                      R$ {stat.receita.toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
                {realizados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-xs text-muted-foreground">
                      Nenhum procedimento realizado neste mês.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PROFESSIONALS COMMISSIONING TABLE */}
        <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="font-display text-xl">Comissionamento de Profissionais</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Sessões realizadas e comissão técnica a receber no mês</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead className="text-center">Sessões Realizadas</TableHead>
                <TableHead className="text-right">Comissão Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionalStats.map((stat) => (
                <TableRow key={stat.id}>
                  <TableCell className="font-medium text-sm">{stat.nome}</TableCell>
                  <TableCell className="text-center text-sm">{stat.quantidade}</TableCell>
                  <TableCell className="text-right text-sm font-semibold text-primary">
                    R$ {Math.round(stat.comissao).toLocaleString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
              {professionalStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-sm text-muted-foreground">
                    Sem comissões acumuladas para profissionais neste período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>

        {/* RETENTION REENGAGEMENT PANEL */}
        <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="font-display text-xl">Leads para Reengajamento</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Oportunidades estagnadas há mais de 30 dias na etapa de interesse.
            </p>
          </div>
          {frios.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhum lead frio no momento ✨
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Dias parado</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {frios.map((c) => {
                  const dias = Math.floor((Date.now() - new Date(c.updated_at!).getTime()) / (24 * 3600 * 1000));
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-sm">{c.cliente_nome}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{c.procedimento_nome}</TableCell>
                      <TableCell><span className="text-stone-850 text-xs font-semibold">{dias} dias</span></TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm" variant="outline"
                          onClick={() => toast.success(`Campanha enviada para ${c.cliente_nome}`)}
                          className="h-8 text-xs"
                        >
                          <Send className="h-3 w-3 mr-1.5" />
                          Campanha
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </section>
      </div>

      {/* DIALOG: CONFIGURAR COMISSÕES */}
      <Dialog open={isComConfigOpen} onOpenChange={setIsComConfigOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>Configuração de Comissões</span>
            </DialogTitle>
            <DialogDescription>
              Defina as taxas de comissões para cada tratamento estético oferecido na clínica.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[380px] overflow-y-auto pr-2 space-y-4 py-2">
            {procedimentos.map((p) => (
              <div key={p.id} className="p-3 border border-border/80 bg-muted/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-foreground truncate pr-2">{p.nome}</p>
                  <span className="text-xs text-muted-foreground shrink-0 font-medium">Preço: R$ {p.valor_sugerido}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tipo de Comissão</Label>
                    <Select
                      value={editingComTipo[p.id] ?? "porcentagem"}
                      onValueChange={(val: "porcentagem" | "fixo") =>
                        setEditingComTipo((s) => ({ ...s, [p.id]: val }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="porcentagem">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Valor da Comissão
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs text-muted-foreground font-semibold">
                        {(editingComTipo[p.id] ?? "porcentagem") === "fixo" ? "R$" : "%"}
                      </span>
                      <Input
                        type="number"
                        className="h-8 text-xs bg-card pl-7"
                        value={editingComValue[p.id] ?? 18}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingComValue((s) => ({ ...s, [p.id]: val }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComConfigOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveComissions}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  label, value, hint, icon,
}: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">{label}</p>
        <div className="h-9 w-9 rounded-lg bg-champagne-soft/50 text-primary flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="font-display text-3xl text-foreground mt-4 font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1.5">{hint}</p>
    </div>
  );
}
