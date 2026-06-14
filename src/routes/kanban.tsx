import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { KANBAN_COLUMNS } from "@/features/kanban/columns";
import { KanbanColumn } from "@/features/kanban/KanbanColumn";
import { AgendarModal } from "@/features/kanban/AgendarModal";
import { ConclusaoModal } from "@/features/kanban/ConclusaoModal";
import { kanbanStore, useKanbanCards } from "@/features/kanban/store";
import { crmStore, useProcedimentos, useClientes } from "@/lib/store";
import type { Agendamento, StatusKanban } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Clock, User, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/kanban")({
  component: KanbanPage,
});

function KanbanPage() {
  return (
    <ProtectedLayout>
      <KanbanBoard />
    </ProtectedLayout>
  );
}

function KanbanBoard() {
  const cards = useKanbanCards();
  const procedimentos = useProcedimentos().filter((p) => p.ativo);
  const clientes = useClientes();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const [activeCard, setActiveCard] = useState<Agendamento | null>(null);

  // Estado de drag-and-drop pendente para a coluna "Agendado"
  const [pendingSchedule, setPendingSchedule] = useState<{
    card: Agendamento;
    previous: StatusKanban;
  } | null>(null);

  // Estado de drag-and-drop pendente para a coluna "Concluído"
  const [pendingCompletion, setPendingCompletion] = useState<{
    card: Agendamento;
    previous: StatusKanban;
  } | null>(null);

  // Modal State - New Lead
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [newLeadNome, setNewLeadNome] = useState("");
  const [newLeadTelefone, setNewLeadTelefone] = useState("");
  const [newLeadProcedimentoId, setNewLeadProcedimentoId] = useState("");
  const [newLeadDuracao, setNewLeadDuracao] = useState(45);
  const [newLeadOrigem, setNewLeadOrigem] = useState<"whatsapp" | "instagram" | "presencial">("whatsapp");

  // Modal State - Edit Lead
  const [editingLead, setEditingLead] = useState<Agendamento | null>(null);
  const [editLeadNome, setEditLeadNome] = useState("");
  const [editLeadTelefone, setEditLeadTelefone] = useState("");
  const [editLeadProcedimentoId, setEditLeadProcedimentoId] = useState("");
  const [editLeadDuracao, setEditLeadDuracao] = useState(45);
  const [editLeadStatus, setEditLeadStatus] = useState<StatusKanban>("novos_clientes");
  const [editLeadOrigem, setEditLeadOrigem] = useState<"whatsapp" | "instagram" | "presencial">("whatsapp");

  const grouped = useMemo(() => {
    const acc: Record<StatusKanban, Agendamento[]> = {
      novos_clientes: [],
      em_atendimento: [],
      agendado: [],
      concluido: [],
    };
    cards.forEach((c) => {
      if (acc[c.status_kanban] !== undefined) {
        acc[c.status_kanban].push(c);
      }
    });
    return acc;
  }, [cards]);

  const onDragStart = (e: DragStartEvent) => {
    const cardId = String(e.active.id);
    const card = cards.find((c) => c.id === cardId);
    if (card) setActiveCard(card);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveCard(null);
    const cardId = String(e.active.id);
    const to = e.over?.id as StatusKanban | undefined;
    if (!to) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.status_kanban === to) return;

    // Interceptar drop na coluna "Agendado" → abrir modal
    if (to === "agendado") {
      // Move otimisticamente para mostrar posição visual
      kanbanStore.set(
        cards.map((c) => (c.id === cardId ? { ...c, status_kanban: "agendado" } : c))
      );
      // Guarda estado anterior para reversão
      setPendingSchedule({ card, previous: card.status_kanban });
      return;
    }

    // Interceptar drop na coluna "Concluído" → abrir modal de finalização
    if (to === "concluido") {
      // Move otimisticamente para mostrar posição visual
      kanbanStore.set(
        cards.map((c) => (c.id === cardId ? { ...c, status_kanban: "concluido" } : c))
      );
      // Guarda estado anterior para reversão
      setPendingCompletion({ card, previous: card.status_kanban });
      return;
    }

    // Para todas as outras colunas, mover diretamente
    kanbanStore.set(
      cards.map((c) => (c.id === cardId ? { ...c, status_kanban: to } : c))
    );
    toast.success(
      `${card.cliente_nome} movido para ${KANBAN_COLUMNS.find((k) => k.id === to)?.label}`
    );
  };

  // Confirm schedule from AgendarModal
  const handleConfirmSchedule = (data: {
    data_hora_inicio: string;
    data_hora_fim: string;
    funcionario_id?: string;
    status_agenda: "pendente" | "confirmado" | "reagendar";
  }) => {
    if (!pendingSchedule) return;
    crmStore.updateAgendamento(pendingSchedule.card.id, {
      status_kanban: "agendado",
      ...data,
    });
    toast.success(`${pendingSchedule.card.cliente_nome} agendado com sucesso!`);
    setPendingSchedule(null);
  };

  // Cancel schedule — revert card to previous column
  const handleCancelSchedule = () => {
    if (!pendingSchedule) return;
    kanbanStore.set(
      kanbanStore
        .get()
        .map((c) =>
          c.id === pendingSchedule.card.id
            ? { ...c, status_kanban: pendingSchedule.previous }
            : c
        )
    );
    setPendingSchedule(null);
  };

  // Confirm completion from ConclusaoModal
  const handleConfirmCompletion = (data: {
    profissional_responsavel: string;
    lote_produto: string;
    data_retorno: string;
  }) => {
    if (!pendingCompletion) return;
    crmStore.updateAgendamento(pendingCompletion.card.id, {
      status_kanban: "concluido",
      profissional_responsavel: data.profissional_responsavel,
      funcionario_id: data.profissional_responsavel, // para compatibilidade de faturamento
      lote_produto: data.lote_produto,
      data_retorno: data.data_retorno,
    });
    toast.success(`${pendingCompletion.card.cliente_nome} finalizado com sucesso!`);
    setPendingCompletion(null);
  };

  // Cancel completion — revert card to previous column
  const handleCancelCompletion = () => {
    if (!pendingCompletion) return;
    kanbanStore.set(
      kanbanStore
        .get()
        .map((c) =>
          c.id === pendingCompletion.card.id
            ? { ...c, status_kanban: pendingCompletion.previous }
            : c
        )
    );
    setPendingCompletion(null);
  };

  const handleOpenNewLead = () => {
    setNewLeadNome("");
    setNewLeadTelefone("");
    setNewLeadOrigem("whatsapp");
    if (procedimentos.length > 0) {
      setNewLeadProcedimentoId(procedimentos[0].id);
      setNewLeadDuracao(procedimentos[0].duracao_minutos);
    } else {
      setNewLeadProcedimentoId("");
      setNewLeadDuracao(45);
    }
    setIsNewLeadOpen(true);
  };

  const handleCreateLead = () => {
    if (!newLeadNome.trim() || !newLeadProcedimentoId || !newLeadOrigem) {
      toast.error("Preencha o nome do paciente, selecione um procedimento e a origem");
      return;
    }

    const proc = procedimentos.find((p) => p.id === newLeadProcedimentoId);

    const newClient = crmStore.addCliente({
      nome: newLeadNome,
      telefone: newLeadTelefone || "+55 11 99999-9999",
      atendimento_ia: false,
      origem: newLeadOrigem,
    });

    crmStore.addAgendamento({
      cliente_id: newClient.id,
      cliente_nome: newClient.nome,
      procedimento_id: newLeadProcedimentoId,
      procedimento_name: proc?.nome,
      procedimento_nome: proc?.nome,
      duracao_minutos: Number(newLeadDuracao),
      status_kanban: "novos_clientes",
    });

    setIsNewLeadOpen(false);
    toast.success(`Lead "${newLeadNome}" criado com sucesso!`);
  };

  const handleStartEditLead = (card: Agendamento) => {
    setEditingLead(card);
    setEditLeadNome(card.cliente_nome ?? "");
    const client = clientes.find((c) => c.id === card.cliente_id);
    setEditLeadTelefone(client?.telefone ?? "");
    setEditLeadProcedimentoId(card.procedimento_id);
    setEditLeadDuracao(card.duracao_minutos ?? 45);
    setEditLeadStatus(card.status_kanban);
    setEditLeadOrigem(client?.origem ?? "whatsapp");
  };

  const handleSaveEditLead = () => {
    if (!editingLead) return;
    if (!editLeadNome.trim() || !editLeadProcedimentoId || !editLeadOrigem) {
      toast.error("Preencha o nome, procedimento e a origem do paciente");
      return;
    }

    const proc = crmStore.getProcedimentos().find((p) => p.id === editLeadProcedimentoId);

    crmStore.updateAgendamento(editingLead.id, {
      cliente_nome: editLeadNome,
      procedimento_id: editLeadProcedimentoId,
      procedimento_nome: proc?.nome ?? editingLead.procedimento_nome,
      duracao_minutos: Number(editLeadDuracao),
      status_kanban: editLeadStatus,
    });

    const client = clientes.find((c) => c.id === editingLead.cliente_id);
    if (client) {
      client.nome = editLeadNome;
      client.telefone = editLeadTelefone;
      client.origem = editLeadOrigem;
      crmStore.notify();
    }

    setEditingLead(null);
    toast.success("Lead atualizado com sucesso!");
  };

  const handleNewLeadProcedureChange = (pId: string) => {
    setNewLeadProcedimentoId(pId);
    const proc = procedimentos.find((p) => p.id === pId);
    if (proc) setNewLeadDuracao(proc.duracao_minutos);
  };

  const handleEditLeadProcedureChange = (pId: string) => {
    setEditLeadProcedimentoId(pId);
    const proc = crmStore.getProcedimentos().find((p) => p.id === pId);
    if (proc) setEditLeadDuracao(proc.duracao_minutos);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="px-10 pt-10 pb-6 border-b border-border bg-background flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-medium">
            Pipeline
          </p>
          <h1 className="font-display text-4xl text-foreground mt-1">
            Gestão de Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Arraste cards entre as etapas. Cards movidos para{" "}
            <em>Agendado</em> abrem o modal de confirmação de horário.
          </p>
        </div>
        <Button
          onClick={handleOpenNewLead}
          className="shadow-md flex items-center gap-2 pr-5"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Novo Lead</span>
        </Button>
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-4 p-8 h-full">
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                label={col.label}
                hint={col.hint}
                cards={grouped[col.id]}
                onEditCard={handleStartEditLead}
                onAddCard={col.id === "novos_clientes" ? handleOpenNewLead : undefined}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeCard ? (
              <div className="bg-card border-2 border-primary rounded-xl p-4 shadow-2xl rotate-2 opacity-95 cursor-grabbing z-[9999] pointer-events-none w-[254px]">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {activeCard.cliente_nome}
                  </p>
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {activeCard.procedimento_nome}
                </p>
                <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activeCard.duracao_minutos} min
                  </span>
                  <span className="uppercase tracking-wider text-[9px] font-medium">
                    #{activeCard.id}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* MODAL: CONFIRMAR AGENDAMENTO (drag → agendado) */}
      <AgendarModal
        open={Boolean(pendingSchedule)}
        card={pendingSchedule?.card ?? null}
        onSave={handleConfirmSchedule}
        onCancel={handleCancelSchedule}
      />

      {/* MODAL: FINALIZAÇÃO DE PROCEDIMENTO (drag → concluído) */}
      <ConclusaoModal
        open={Boolean(pendingCompletion)}
        card={pendingCompletion?.card ?? null}
        onSave={handleConfirmCompletion}
        onCancel={handleCancelCompletion}
      />

      {/* MODAL: NOVO LEAD */}
      <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <span>Cadastrar Novo Lead</span>
            </DialogTitle>
            <DialogDescription>
              Insira os dados do paciente para adicioná-lo ao pipeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newLeadNome">Nome do Paciente *</Label>
              <Input
                id="newLeadNome"
                placeholder="Ex: Amanda Silva"
                value={newLeadNome}
                onChange={(e) => setNewLeadNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newLeadTelefone">Telefone / WhatsApp</Label>
              <Input
                id="newLeadTelefone"
                placeholder="Ex: +55 11 99999-8888"
                value={newLeadTelefone}
                onChange={(e) => setNewLeadTelefone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newLeadOrigem">Qual a origem deste lead? *</Label>
              <Select
                value={newLeadOrigem}
                onValueChange={(val) => setNewLeadOrigem(val as any)}
              >
                <SelectTrigger id="newLeadOrigem">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="presencial">Atendimento no Local (Presencial)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newLeadProcedimento">Procedimento de Interesse *</Label>
              <Select
                value={newLeadProcedimentoId}
                onValueChange={handleNewLeadProcedureChange}
              >
                <SelectTrigger id="newLeadProcedimento">
                  <SelectValue placeholder="Selecione um procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {procedimentos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} (R$ {p.valor_sugerido})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newLeadDuracao">Duração Prevista (minutos)</Label>
              <Input
                id="newLeadDuracao"
                type="number"
                value={newLeadDuracao}
                onChange={(e) => setNewLeadDuracao(Number(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewLeadOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateLead}
              disabled={!newLeadNome.trim() || !newLeadProcedimentoId}
            >
              Criar Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR LEAD */}
      <Dialog
        open={Boolean(editingLead)}
        onOpenChange={(o) => !o && setEditingLead(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <span>Editar Lead / Pipeline</span>
            </DialogTitle>
            <DialogDescription>
              Modifique as informações e estágio do lead no funil.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editLeadNome">Nome do Paciente *</Label>
              <Input
                id="editLeadNome"
                value={editLeadNome}
                onChange={(e) => setEditLeadNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editLeadTelefone">Telefone / WhatsApp</Label>
              <Input
                id="editLeadTelefone"
                value={editLeadTelefone}
                onChange={(e) => setEditLeadTelefone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editLeadOrigem">Qual a origem deste lead? *</Label>
              <Select
                value={editLeadOrigem}
                onValueChange={(val) => setEditLeadOrigem(val as any)}
              >
                <SelectTrigger id="editLeadOrigem">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="presencial">Atendimento no Local (Presencial)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editLeadProcedimento">Procedimento</Label>
              <Select
                value={editLeadProcedimentoId}
                onValueChange={handleEditLeadProcedureChange}
              >
                <SelectTrigger id="editLeadProcedimento">
                  <SelectValue placeholder="Selecione um procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {crmStore.getProcedimentos().map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} (R$ {p.valor_sugerido})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editLeadDuracao">Duração (min)</Label>
                <Input
                  id="editLeadDuracao"
                  type="number"
                  value={editLeadDuracao}
                  onChange={(e) => setEditLeadDuracao(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editLeadStatus">Estágio do Funil</Label>
                <Select
                  value={editLeadStatus}
                  onValueChange={(val) => setEditLeadStatus(val as StatusKanban)}
                >
                  <SelectTrigger id="editLeadStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KANBAN_COLUMNS.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLead(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEditLead}
              disabled={!editLeadNome.trim() || !editLeadProcedimentoId}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
