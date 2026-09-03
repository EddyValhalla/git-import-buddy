import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useFluxosAutomacao } from "@/lib/store";
import { useProcedimentos } from "@/lib/store";
import type { FluxoAutomacao, TipoMensagem } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Plus,
  Zap,
  RefreshCw,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/fluxos-automacao")({
  head: () => ({
    meta: [
      { title: "Fluxos de Automação | Lumière CRM" },
      { name: "description", content: "Gerencie os fluxos de mensagens automáticas pós-procedimento." },
    ],
  }),
  component: () => (
    <ProtectedLayout>
      <FluxosAutomacaoPage />
    </ProtectedLayout>
  ),
});

// ── Configuração visual dos tipos de mensagem ──────────────────────────────────
const TIPO_CONFIG: Record<TipoMensagem, { label: string; cor: string; bg: string; bordas: string }> = {
  nutricao:   { label: "Nutrição",   cor: "text-emerald-700", bg: "bg-emerald-50",  bordas: "border-emerald-300" },
  checkin:    { label: "Check-in",   cor: "text-blue-700",    bg: "bg-blue-50",     bordas: "border-blue-300"    },
  crossell:   { label: "Crossell",   cor: "text-violet-700",  bg: "bg-violet-50",   bordas: "border-violet-300"  },
  risco:      { label: "Risco",      cor: "text-orange-700",  bg: "bg-orange-50",   bordas: "border-orange-300"  },
  reposicao:  { label: "Reposição",  cor: "text-rose-700",    bg: "bg-rose-50",     bordas: "border-rose-300"    },
  lembrete:   { label: "Lembrete",   cor: "text-slate-600",   bg: "bg-slate-50",    bordas: "border-slate-300"   },
};

const DIAS_TIMELINE = [0, 1, 3, 7, 15, 30, 45, 60, 90];

function BadgeTipo({ tipo }: { tipo: TipoMensagem }) {
  const cfg = TIPO_CONFIG[tipo] ?? TIPO_CONFIG.lembrete;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", cfg.cor, cfg.bg, cfg.bordas)}>
      {cfg.label}
    </span>
  );
}

// ── Formulário de fluxo ────────────────────────────────────────────────────────
interface FluxoForm {
  procedimento_id: string;
  dia_offset: number;
  tipo_mensagem: TipoMensagem;
  template: string;
  ativo: boolean;
}

const FORM_VAZIO: FluxoForm = {
  procedimento_id: "",
  dia_offset: 7,
  tipo_mensagem: "checkin",
  template: "",
  ativo: true,
};

function FluxosAutomacaoPage() {
  const { data: fluxos, loading, error, refetch, add, update, remove } = useFluxosAutomacao();
  const procedimentos = useProcedimentos();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<FluxoAutomacao | null>(null);
  const [form, setForm] = useState<FluxoForm>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  // Agrupa fluxos por procedimento_id
  const agrupados = useMemo(() => {
    const grupos: Record<string, FluxoAutomacao[]> = { "__todos__": [] };
    for (const f of fluxos) {
      const chave = f.procedimento_id ?? "__todos__";
      (grupos[chave] ??= []).push(f);
    }
    return grupos;
  }, [fluxos]);

  // Abre modal para novo fluxo
  const abrirNovo = () => {
    setEditando(null);
    setForm(FORM_VAZIO);
    setModalAberto(true);
  };

  // Abre modal para editar
  const abrirEditar = (f: FluxoAutomacao) => {
    setEditando(f);
    setForm({
      procedimento_id: f.procedimento_id ?? "",
      dia_offset: f.dia_offset,
      tipo_mensagem: f.tipo_mensagem,
      template: f.template,
      ativo: f.ativo,
    });
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!form.template.trim()) { toast.error("Template é obrigatório"); return; }
    setSalvando(true);
    try {
      const payload = {
        procedimento_id: form.procedimento_id || null,
        dia_offset: form.dia_offset,
        tipo_mensagem: form.tipo_mensagem,
        template: form.template,
        ativo: form.ativo,
      };
      if (editando) {
        await update(editando.id, payload);
        toast.success("Fluxo atualizado!");
      } else {
        await add(payload);
        toast.success("Fluxo criado!");
      }
      setModalAberto(false);
    } catch (e) {
      toast.error(`Erro: ${String(e)}`);
    } finally {
      setSalvando(false);
    }
  };

  const deletar = async (id: string) => {
    if (!confirm("Remover este fluxo?")) return;
    try {
      await remove(id);
      toast.success("Fluxo removido.");
    } catch (e) {
      toast.error(`Erro: ${String(e)}`);
    }
  };

  const toggleAtivo = async (f: FluxoAutomacao) => {
    try {
      await update(f.id, { ativo: !f.ativo });
      toast.success(f.ativo ? "Fluxo pausado." : "Fluxo ativado.");
    } catch (e) {
      toast.error(`Erro: ${String(e)}`);
    }
  };

  const toggleExpansao = (key: string) =>
    setExpandidos((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const nomeProcedimento = (id: string | null) => {
    if (!id) return "Todos os procedimentos";
    return procedimentos.find((p) => p.id === id)?.nome ?? "Procedimento";
  };

  return (
    <div className="p-10 space-y-8 max-w-[1200px]">
      {/* Header */}
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-medium">CRM Estratégico</p>
          <h1 className="font-display text-4xl text-foreground mt-1">Fluxos de Automação</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {fluxos.length} fluxo{fluxos.length !== 1 ? "s" : ""} configurado{fluxos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void refetch()} disabled={loading} className="gap-2" id="btn-fluxos-refresh">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button onClick={abrirNovo} className="gap-2" id="btn-novo-fluxo">
            <Plus className="h-4 w-4" />
            Novo Fluxo
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-5 py-4 text-sm text-rose-700">
          Erro: {error}
        </div>
      )}

      {/* Timeline de referência */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-4">
          Timeline de Referência (dias após procedimento)
        </p>
        <div className="relative">
          {/* Linha horizontal */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
          <div className="flex justify-between relative">
            {DIAS_TIMELINE.map((dia) => {
              const fluxosNoDia = fluxos.filter((f) => f.dia_offset === dia);
              return (
                <div key={dia} className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "h-8 w-8 rounded-full border-2 flex items-center justify-center text-[11px] font-bold z-10 bg-card",
                    fluxosNoDia.length > 0 ? "border-primary text-primary" : "border-border text-muted-foreground"
                  )}>
                    {fluxosNoDia.length > 0 ? fluxosNoDia.length : "·"}
                  </div>
                  <span className="text-[10px] text-muted-foreground">D{dia}</span>
                  {fluxosNoDia.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      {fluxosNoDia.slice(0, 2).map((f) => (
                        <span key={f.id} className={cn(
                          "text-[9px] px-1 py-0.5 rounded font-medium",
                          TIPO_CONFIG[f.tipo_mensagem]?.bg,
                          TIPO_CONFIG[f.tipo_mensagem]?.cor
                        )}>
                          {TIPO_CONFIG[f.tipo_mensagem]?.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Accordion agrupado por procedimento */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : fluxos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border text-center">
          <Zap className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum fluxo configurado ainda.</p>
          <Button onClick={abrirNovo} className="mt-4 gap-2" variant="outline" id="btn-novo-fluxo-empty">
            <Plus className="h-4 w-4" /> Criar primeiro fluxo
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(agrupados).map(([key, lista]) => {
            if (lista.length === 0) return null;
            const aberto = expandidos.has(key);
            return (
              <div key={key} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {/* Cabeçalho do grupo */}
                <button
                  onClick={() => toggleExpansao(key)}
                  id={`accordion-${key}`}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {nomeProcedimento(key === "__todos__" ? null : key)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {lista.length} fluxo{lista.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {aberto ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>

                {/* Lista de fluxos */}
                {aberto && (
                  <div className="border-t border-border">
                    {lista
                      .sort((a, b) => a.dia_offset - b.dia_offset)
                      .map((f, idx) => (
                        <div
                          key={f.id}
                          className={cn(
                            "flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/20",
                            idx !== lista.length - 1 && "border-b border-border/60",
                            !f.ativo && "opacity-60"
                          )}
                        >
                          {/* Dia */}
                          <div className="shrink-0 text-center w-12">
                            <p className="text-lg font-bold text-foreground font-mono">D{f.dia_offset}</p>
                            <p className="text-[10px] text-muted-foreground">dias</p>
                          </div>

                          {/* Tipo + template */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <BadgeTipo tipo={f.tipo_mensagem} />
                              {!f.ativo && (
                                <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                                  Pausado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{f.template}</p>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => void toggleAtivo(f)}
                              id={`toggle-ativo-${f.id}`}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title={f.ativo ? "Pausar fluxo" : "Ativar fluxo"}
                            >
                              {f.ativo
                                ? <ToggleRight className="h-4 w-4 text-emerald-600" />
                                : <ToggleLeft className="h-4 w-4" />
                              }
                            </button>
                            <button
                              onClick={() => abrirEditar(f)}
                              id={`btn-editar-fluxo-${f.id}`}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => void deletar(f.id)}
                              id={`btn-deletar-fluxo-${f.id}`}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Remover"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal novo/editar fluxo */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg" id="modal-fluxo">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Fluxo" : "Novo Fluxo de Automação"}</DialogTitle>
            <DialogDescription>
              Configure quando e qual mensagem será enviada após o procedimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Procedimento */}
            <div className="space-y-1.5">
              <Label htmlFor="select-proc-fluxo">Procedimento</Label>
              <Select
                value={form.procedimento_id || "__todos__"}
                onValueChange={(v) => setForm({ ...form, procedimento_id: v === "__todos__" ? "" : v })}
              >
                <SelectTrigger id="select-proc-fluxo">
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos__">Todos os procedimentos</SelectItem>
                  {procedimentos.filter((p) => p.ativo).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dia offset */}
            <div className="space-y-1.5">
              <Label htmlFor="input-dia-offset">Dias após o procedimento</Label>
              <div className="flex gap-2 flex-wrap">
                {DIAS_TIMELINE.map((d) => (
                  <button
                    key={d}
                    type="button"
                    id={`dia-btn-${d}`}
                    onClick={() => setForm({ ...form, dia_offset: d })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      form.dia_offset === d
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    D{d}
                  </button>
                ))}
                <Input
                  id="input-dia-offset"
                  type="number"
                  min={0}
                  max={365}
                  value={form.dia_offset}
                  onChange={(e) => setForm({ ...form, dia_offset: Number(e.target.value) })}
                  className="w-20 h-8 text-xs"
                  placeholder="Outro"
                />
              </div>
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <Label htmlFor="select-tipo-mensagem">Tipo de Mensagem</Label>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(TIPO_CONFIG) as [TipoMensagem, typeof TIPO_CONFIG[TipoMensagem]][]).map(([tipo, cfg]) => (
                  <button
                    key={tipo}
                    type="button"
                    id={`tipo-btn-${tipo}`}
                    onClick={() => setForm({ ...form, tipo_mensagem: tipo })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                      form.tipo_mensagem === tipo
                        ? `${cfg.bg} ${cfg.bordas} ${cfg.cor}`
                        : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template */}
            <div className="space-y-1.5">
              <Label htmlFor="textarea-template">Template da Mensagem</Label>
              <textarea
                id="textarea-template"
                rows={4}
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
                placeholder="Olá {nome}! Como você está se sentindo após o procedimento?"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground">
                Use {"{nome}"}, {"{procedimento}"}, {"{dias}"} como variáveis.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)} id="btn-cancelar-fluxo">
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={() => void salvar()} disabled={salvando} id="btn-salvar-fluxo">
              {salvando ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              {editando ? "Salvar" : "Criar Fluxo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
