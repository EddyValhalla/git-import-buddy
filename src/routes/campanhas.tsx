import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useCampanhas, useClientes } from "@/lib/store";
import type { Campanha, RFMSegmento, StatusCampanha } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Plus,
  Megaphone,
  RefreshCw,
  Trash2,
  Edit2,
  Check,
  X,
  Users,
  Calendar,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
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

export const Route = createFileRoute("/campanhas")({
  head: () => ({
    meta: [
      { title: "Campanhas | Lumière CRM" },
      { name: "description", content: "Gerencie campanhas de marketing segmentadas por RFM." },
    ],
  }),
  component: () => (
    <ProtectedLayout>
      <CampanhasPage />
    </ProtectedLayout>
  ),
});

// ── Configurações visuais ──────────────────────────────────────────────────────
const STATUS_CFG: Record<StatusCampanha, { label: string; cor: string; bg: string; bordas: string; icon: React.ReactNode }> = {
  rascunho:  { label: "Rascunho",  cor: "text-slate-600",   bg: "bg-slate-50",   bordas: "border-slate-300",   icon: <FileText className="h-3 w-3" />      },
  agendada:  { label: "Agendada",  cor: "text-blue-700",    bg: "bg-blue-50",    bordas: "border-blue-300",    icon: <Clock className="h-3 w-3" />         },
  enviada:   { label: "Enviada",   cor: "text-emerald-700", bg: "bg-emerald-50", bordas: "border-emerald-300", icon: <CheckCircle2 className="h-3 w-3" />   },
  cancelada: { label: "Cancelada", cor: "text-rose-700",    bg: "bg-rose-50",    bordas: "border-rose-300",    icon: <XCircle className="h-3 w-3" />        },
};

const SEGMENTO_LABELS: Record<string, string> = {
  Campeoes:  "Campeões",
  Leais:     "Leais",
  Potencial: "Potencial",
  Novos:     "Novos",
  Em_Risco:  "Em Risco",
  Inativos:  "Inativos",
  Perdidos:  "Perdidos",
};

function BadgeStatus({ status }: { status: StatusCampanha }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.rascunho;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border", cfg.cor, cfg.bg, cfg.bordas)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function BadgeSegmento({ segmento }: { segmento: RFMSegmento | null }) {
  if (!segmento) return <span className="text-xs text-muted-foreground">Todos</span>;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
      {SEGMENTO_LABELS[segmento] ?? segmento}
    </span>
  );
}

// ── Formulário ─────────────────────────────────────────────────────────────────
interface CampanhaForm {
  nome: string;
  data_disparo: string;
  segmento_alvo: string;
  template: string;
  status: StatusCampanha;
}

const FORM_VAZIO: CampanhaForm = {
  nome: "",
  data_disparo: "",
  segmento_alvo: "__todos__",
  template: "",
  status: "rascunho",
};

function CampanhasPage() {
  const { data: campanhas, loading, error, refetch, add, update, remove } = useCampanhas();
  const clientes = useClientes();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Campanha | null>(null);
  const [form, setForm] = useState<CampanhaForm>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  // Conta clientes por segmento para o preview
  const contagemPorSegmento = useMemo(() => {
    const contagem: Record<string, number> = { __todos__: clientes.length };
    for (const c of clientes) {
      if (c.rfm_segmento) {
        contagem[c.rfm_segmento] = (contagem[c.rfm_segmento] ?? 0) + 1;
      }
    }
    return contagem;
  }, [clientes]);

  // Campanhas filtradas
  const filtradas = useMemo(() => {
    if (filtroStatus === "todos") return campanhas;
    return campanhas.filter((c) => c.status === filtroStatus);
  }, [campanhas, filtroStatus]);

  const abrirNova = () => {
    setEditando(null);
    setForm(FORM_VAZIO);
    setModalAberto(true);
  };

  const abrirEditar = (c: Campanha) => {
    setEditando(c);
    setForm({
      nome: c.nome,
      data_disparo: c.data_disparo ? c.data_disparo.slice(0, 16) : "",
      segmento_alvo: c.segmento_alvo ?? "__todos__",
      template: c.template,
      status: c.status,
    });
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!form.template.trim()) { toast.error("Template é obrigatório"); return; }
    setSalvando(true);
    try {
      const payload = {
        nome: form.nome,
        data_disparo: form.data_disparo || null,
        segmento_alvo: form.segmento_alvo === "__todos__" ? null : form.segmento_alvo as RFMSegmento,
        template: form.template,
        status: form.status,
      };
      if (editando) {
        await update(editando.id, payload);
        toast.success("Campanha atualizada!");
      } else {
        await add(payload);
        toast.success("Campanha criada!");
      }
      setModalAberto(false);
    } catch (e) {
      toast.error(`Erro: ${String(e)}`);
    } finally {
      setSalvando(false);
    }
  };

  const deletar = async (id: string) => {
    if (!confirm("Remover esta campanha?")) return;
    try {
      await remove(id);
      toast.success("Campanha removida.");
    } catch (e) {
      toast.error(`Erro: ${String(e)}`);
    }
  };

  const formatData = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  // Preview: quantos clientes vão receber
  const previewCount = contagemPorSegmento[form.segmento_alvo] ?? 0;

  return (
    <div className="p-10 space-y-8 max-w-[1200px]">
      {/* Header */}
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-medium">CRM Estratégico</p>
          <h1 className="font-display text-4xl text-foreground mt-1">Campanhas</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {campanhas.length} campanha{campanhas.length !== 1 ? "s" : ""} no total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void refetch()} disabled={loading} className="gap-2" id="btn-campanhas-refresh">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button onClick={abrirNova} className="gap-2" id="btn-nova-campanha">
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-5 py-4 text-sm text-rose-700">
          Erro: {error}
        </div>
      )}

      {/* Cards de status resumido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(Object.entries(STATUS_CFG) as [StatusCampanha, typeof STATUS_CFG[StatusCampanha]][]).map(([status, cfg]) => {
          const count = campanhas.filter((c) => c.status === status).length;
          return (
            <button
              key={status}
              id={`card-status-${status}`}
              onClick={() => setFiltroStatus(filtroStatus === status ? "todos" : status)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all hover:shadow-md",
                filtroStatus === status
                  ? `${cfg.bg} ${cfg.bordas} shadow-sm`
                  : "bg-card border-border hover:border-primary/30"
              )}
            >
              <div className={cn("flex items-center gap-1.5 mb-1", cfg.cor)}>
                {cfg.icon}
                <span className="text-[11px] font-semibold">{cfg.label}</span>
              </div>
              <p className={cn("text-3xl font-bold", cfg.cor)}>{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-3">
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-44" id="select-filtro-status">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {(Object.entries(STATUS_CFG) as [StatusCampanha, typeof STATUS_CFG[StatusCampanha]][]).map(([s, c]) => (
              <SelectItem key={s} value={s}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtradas.length} campanha{filtradas.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Lista de campanhas */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma campanha encontrada.</p>
          <Button onClick={abrirNova} className="mt-4 gap-2" variant="outline" id="btn-nova-campanha-empty">
            <Plus className="h-4 w-4" /> Criar campanha
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Header tabela */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 px-5 py-3 bg-muted/40 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            <span>Campanha</span>
            <span>Segmento</span>
            <span>Disparo</span>
            <span className="text-center">Status</span>
            <span className="text-center">Ações</span>
          </div>

          {filtradas.map((campanha, idx) => (
            <div
              key={campanha.id}
              className={cn(
                "grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 px-5 py-4 items-center transition-colors hover:bg-muted/20",
                idx !== filtradas.length - 1 && "border-b border-border/60"
              )}
            >
              {/* Nome + preview */}
              <div>
                <p className="text-sm font-semibold text-foreground">{campanha.nome}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{campanha.template}</p>
              </div>

              {/* Segmento */}
              <div>
                <BadgeSegmento segmento={campanha.segmento_alvo} />
                {campanha.segmento_alvo && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {contagemPorSegmento[campanha.segmento_alvo] ?? 0} clientes
                  </p>
                )}
              </div>

              {/* Data de disparo */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">{formatData(campanha.data_disparo)}</span>
              </div>

              {/* Status */}
              <div className="flex justify-center">
                <BadgeStatus status={campanha.status} />
              </div>

              {/* Ações */}
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => abrirEditar(campanha)}
                  id={`btn-editar-campanha-${campanha.id}`}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Editar"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => void deletar(campanha.id)}
                  id={`btn-deletar-campanha-${campanha.id}`}
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

      {/* Modal */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg" id="modal-campanha">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
            <DialogDescription>Configure os detalhes da campanha de marketing.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="input-nome-campanha">Nome da Campanha</Label>
              <Input
                id="input-nome-campanha"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Reativação Inativos — Agosto"
              />
            </div>

            {/* Segmento */}
            <div className="space-y-1.5">
              <Label htmlFor="select-segmento-campanha">Segmento Alvo</Label>
              <Select
                value={form.segmento_alvo}
                onValueChange={(v) => setForm({ ...form, segmento_alvo: v })}
              >
                <SelectTrigger id="select-segmento-campanha">
                  <SelectValue placeholder="Selecione o segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos__">Todos os clientes</SelectItem>
                  {Object.entries(SEGMENTO_LABELS).map(([seg, label]) => (
                    <SelectItem key={seg} value={seg}>
                      {label} ({contagemPorSegmento[seg] ?? 0} clientes)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Preview de alcance */}
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>
                  Esta campanha alcançará <strong className="text-foreground">{previewCount}</strong> clientes
                </span>
              </div>
            </div>

            {/* Data e hora de disparo */}
            <div className="space-y-1.5">
              <Label htmlFor="input-data-disparo">Data e Hora do Disparo</Label>
              <Input
                id="input-data-disparo"
                type="datetime-local"
                value={form.data_disparo}
                onChange={(e) => setForm({ ...form, data_disparo: e.target.value })}
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="select-status-campanha">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as StatusCampanha })}
              >
                <SelectTrigger id="select-status-campanha">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_CFG) as [StatusCampanha, typeof STATUS_CFG[StatusCampanha]][]).map(([s, c]) => (
                    <SelectItem key={s} value={s}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template */}
            <div className="space-y-1.5">
              <Label htmlFor="textarea-template-campanha">Mensagem / Template</Label>
              <textarea
                id="textarea-template-campanha"
                rows={4}
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
                placeholder="Olá {nome}! Sentimos sua falta na Lumière. Que tal agendar um horário especial?"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground">Use {"{nome}"}, {"{segmento}"} como variáveis.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)} id="btn-cancelar-campanha">
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={() => void salvar()} disabled={salvando} id="btn-salvar-campanha">
              {salvando ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              {editando ? "Salvar" : "Criar Campanha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
