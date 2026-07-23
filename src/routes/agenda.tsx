import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useAgendamentos, useFuncionarios, useProcedimentos, crmStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Trash2, Edit3, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StatusAgenda, StatusKanban } from "@/lib/types";
import { checkScheduleConflict } from "@/lib/scheduleConflict";

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
import { toast } from "sonner";

export const Route = createFileRoute("/agenda")({
  component: () => (
    <ProtectedLayout>
      <AgendaPage />
    </ProtectedLayout>
  ),
});

const STATUS_STYLES: Record<StatusAgenda, string> = {
  pendente: "bg-warning/15 border-warning/40 text-stone-850 hover:bg-warning/20 transition-colors cursor-pointer",
  confirmado: "bg-success/15 border-success/40 text-stone-850 hover:bg-success/20 transition-colors cursor-pointer",
  reagendar: "bg-danger/15 border-danger/40 text-stone-850 hover:bg-danger/20 transition-colors cursor-pointer",
};

const STATUS_LABEL: Record<StatusAgenda, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  reagendar: "Reagendar",
};

function AgendaPage() {
  const agendamentos = useAgendamentos();
  const funcionarios = useFuncionarios().filter(f => f.status === "ativo");
  const procedimentos = useProcedimentos().filter(p => p.ativo);
  const [cursor, setCursor] = useState(new Date());

  // Modal states - New Appointment
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newPacNome, setNewPacNome] = useState("");
  const [newPacTel, setNewPacTel] = useState("");
  const [newProcId, setNewProcId] = useState("");
  const [newFuncId, setNewFuncId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("10:00");
  const [newDuration, setNewDuration] = useState(45);
  const [newStatus, setNewStatus] = useState<StatusAgenda>("pendente");

  // Modal states - Edit/Manage Appointment
  const [selectedAgendamento, setSelectedAgendamento] = useState<any | null>(null);
  const [editPacNome, setEditPacNome] = useState("");
  const [editPacTel, setEditPacTel] = useState("");
  const [editProcId, setEditProcId] = useState("");
  const [editFuncId, setEditFuncId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDuration, setEditDuration] = useState(45);
  const [editStatus, setEditStatus] = useState<StatusAgenda>("pendente");

  // Compute 7 days of the current week (Sunday to Saturday)
  const days = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(start.getDate() - start.getDay()); // Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  // Hours: 8:00 to 19:00
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  // Open scheduling modal
  const handleOpenNew = () => {
    setNewPacNome("");
    setNewPacTel("");
    if (procedimentos.length > 0) {
      setNewProcId(procedimentos[0].id);
      setNewDuration(procedimentos[0].duracao_minutos);
    } else {
      setNewProcId("");
      setNewDuration(45);
    }
    if (funcionarios.length > 0) {
      setNewFuncId(funcionarios[0].id);
    } else {
      setNewFuncId("");
    }
    // Set date to first day of week or today
    const today = new Date();
    setNewDate(today.toISOString().split("T")[0]);
    setNewTime("10:00");
    setNewStatus("pendente");
    setIsNewOpen(true);
  };

  const handleProcedureChange = (pId: string) => {
    setNewProcId(pId);
    const proc = procedimentos.find(p => p.id === pId);
    if (proc) {
      setNewDuration(proc.duracao_minutos);
    }
  };

  const handleEditProcedureChange = (pId: string) => {
    setEditProcId(pId);
    const proc = crmStore.getProcedimentos().find(p => p.id === pId);
    if (proc) {
      setEditDuration(proc.duracao_minutos);
    }
  };

  // Create appointment
  const handleCreateAppointment = () => {
    if (!newPacNome.trim() || !newProcId || !newDate || !newTime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const proc = procedimentos.find(p => p.id === newProcId);

    // Parse start date & time
    const startStr = `${newDate}T${newTime}:00`;
    const start = new Date(startStr);
    const end = new Date(start.getTime() + newDuration * 60000);

    // Verifica conflito de horário
    const conflict = checkScheduleConflict({
      funcionario_id: newFuncId || undefined,
      data_hora_inicio: start.toISOString(),
      data_hora_fim: end.toISOString(),
    });
    if (conflict.hasConflict) {
      toast.error(conflict.message!);
      return;
    }

    // 1. Create client
    const newClient = crmStore.addCliente({
      nome: newPacNome,
      telefone: newPacTel || "+55 11 99999-9999",
      atendimento_ia: false,
    });

    // 2. Add scheduling
    crmStore.addAgendamento({
      cliente_id: newClient.id,
      cliente_nome: newClient.nome,
      procedimento_id: newProcId,
      procedimento_nome: proc?.nome,
      funcionario_id: newFuncId || undefined,
      duracao_minutos: newDuration,
      status_kanban: "agendado", // Scheduled lead
      status_agenda: newStatus,
      data_hora_inicio: start.toISOString(),
      data_hora_fim: end.toISOString(),
    });

    setIsNewOpen(false);
    toast.success("Agendamento criado com sucesso!");
  };


  // Open edit appointment modal
  const handleOpenEdit = (a: any) => {
    setSelectedAgendamento(a);
    setEditPacNome(a.cliente_nome ?? "");
    const client = crmStore.getClientes().find(c => c.id === a.cliente_id);
    setEditPacTel(client?.telefone ?? "");
    setEditProcId(a.procedimento_id);
    setEditFuncId(a.funcionario_id ?? "");
    setEditDuration(a.duracao_minutos ?? 45);
    setEditStatus(a.status_agenda ?? "pendente");

    if (a.data_hora_inicio) {
      const d = new Date(a.data_hora_inicio);
      // Format as YYYY-MM-DD
      setEditDate(d.toISOString().split("T")[0]);
      // Format as HH:MM
      setEditTime(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      );
    } else {
      setEditDate(new Date().toISOString().split("T")[0]);
      setEditTime("10:00");
    }
  };

  // Save changes
  const handleSaveEdit = () => {
    if (!selectedAgendamento) return;
    if (!editPacNome.trim() || !editProcId || !editDate || !editTime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const proc = crmStore.getProcedimentos().find(p => p.id === editProcId);
    
    // Parse start date & time
    const startStr = `${editDate}T${editTime}:00`;
    const start = new Date(startStr);
    const end = new Date(start.getTime() + editDuration * 60000);

    // Verifica conflito de horário (ignorando o próprio agendamento em edição)
    const conflict = checkScheduleConflict({
      funcionario_id: editFuncId || undefined,
      data_hora_inicio: start.toISOString(),
      data_hora_fim: end.toISOString(),
      ignoreId: selectedAgendamento.id,
    });
    if (conflict.hasConflict) {
      toast.error(conflict.message!);
      return;
    }


    // Update appointment
    crmStore.updateAgendamento(selectedAgendamento.id, {
      cliente_nome: editPacNome,
      procedimento_id: editProcId,
      procedimento_nome: proc?.nome ?? selectedAgendamento.procedimento_nome,
      funcionario_id: editFuncId || undefined,
      duracao_minutos: Number(editDuration),
      status_agenda: editStatus,
      data_hora_inicio: start.toISOString(),
      data_hora_fim: end.toISOString(),
    });

    // Also update client name and telephone
    const client = crmStore.getClientes().find(c => c.id === selectedAgendamento.cliente_id);
    if (client) {
      client.nome = editPacNome;
      client.telefone = editPacTel;
      crmStore.notify();
    }

    setSelectedAgendamento(null);
    toast.success("Agendamento atualizado com sucesso!");
  };

  // Delete appointment
  const handleDelete = () => {
    if (!selectedAgendamento) return;
    crmStore.deleteAgendamento(selectedAgendamento.id);
    setSelectedAgendamento(null);
    toast.success("Agendamento excluído com sucesso!");
  };

  return (
    <div className="p-10 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-medium">Calendário</p>
          <h1 className="font-display text-4xl text-foreground mt-1">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Semana de {days[0].toLocaleDateString("pt-BR", { day: 'numeric', month: 'long' })} a {days[6].toLocaleDateString("pt-BR", { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => {
                const d = new Date(cursor);
                d.setDate(d.getDate() - 7);
                setCursor(d);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="h-8 text-xs font-semibold px-3 hover:text-primary"
              onClick={() => setCursor(new Date())}
            >
              {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => {
                const d = new Date(cursor);
                d.setDate(d.getDate() + 7);
                setCursor(d);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleOpenNew} className="shadow-md flex items-center gap-2 pr-5">
            <Plus className="h-4.5 w-4.5" />
            <span>Novo Agendamento</span>
          </Button>
        </div>
      </header>

      <div className="rounded-2xl bg-card border border-border shadow-sm overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border bg-muted/40">
            <div className="flex items-center justify-center text-muted-foreground">
              <CalendarDays className="h-4 w-4 opacity-50" />
            </div>
            {days.map((d) => (
              <div key={d.toISOString()} className="px-3 py-3 text-center border-l border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                </p>
                <p
                  className={cn(
                    "font-display text-xl mt-0.5 h-7 w-7 flex items-center justify-center mx-auto rounded-full",
                    sameDay(d, new Date())
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground"
                  )}
                >
                  {d.getDate()}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[80px_repeat(7,1fr)] relative">
            {/* Hour headers */}
            <div>
              {hours.map((h) => (
                <div
                  key={h}
                  className="h-20 px-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border pt-1 font-mono"
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>
            {/* Columns per day */}
            {days.map((d) => (
              <div key={d.toISOString()} className="relative border-l border-border bg-card/10">
                {hours.map((h) => (
                  <div key={h} className="h-20 border-b border-border/60" />
                ))}
                {(() => {
                  // Agendamentos do dia, ordenados por início
                  const dayItems = agendamentos
                    .filter((a) => a.data_hora_inicio && sameDay(new Date(a.data_hora_inicio), d))
                    .map((a) => {
                      const start = new Date(a.data_hora_inicio!);
                      const end = new Date(
                        a.data_hora_fim ??
                          new Date(start.getTime() + (a.duracao_minutos ?? 30) * 60000).toISOString()
                      );
                      return { a, start, end };
                    })
                    .sort((x, y) => x.start.getTime() - y.start.getTime());

                  // Agrupa itens que se sobrepõem (transitivo) e atribui coluna
                  type Layout = {
                    a: typeof dayItems[number]["a"];
                    start: Date;
                    col: number;
                    cols: number;
                    top: number;
                    height: number;
                  };
                  const layouts: Layout[] = [];
                  let cluster: typeof dayItems = [];
                  let clusterEnd = 0;

                  const flush = () => {
                    if (!cluster.length) return;
                    // Atribuição gulosa de colunas
                    const colEnds: number[] = [];
                    const assigned: number[] = [];
                    cluster.forEach((it) => {
                      let placed = -1;
                      for (let i = 0; i < colEnds.length; i++) {
                        if (colEnds[i] <= it.start.getTime()) {
                          placed = i;
                          break;
                        }
                      }
                      if (placed === -1) {
                        placed = colEnds.length;
                        colEnds.push(it.end.getTime());
                      } else {
                        colEnds[placed] = it.end.getTime();
                      }
                      assigned.push(placed);
                    });
                    const cols = colEnds.length;
                    cluster.forEach((it, idx) => {
                      const top =
                        (it.start.getHours() - 8) * 80 + (it.start.getMinutes() / 60) * 80;
                      const height = ((it.a.duracao_minutos ?? 30) / 60) * 80;
                      layouts.push({
                        a: it.a,
                        start: it.start,
                        col: assigned[idx],
                        cols,
                        top,
                        height,
                      });
                    });
                    cluster = [];
                    clusterEnd = 0;
                  };

                  dayItems.forEach((it) => {
                    if (!cluster.length || it.start.getTime() < clusterEnd) {
                      cluster.push(it);
                      clusterEnd = Math.max(clusterEnd, it.end.getTime());
                    } else {
                      flush();
                      cluster.push(it);
                      clusterEnd = it.end.getTime();
                    }
                  });
                  flush();

                  return layouts.map(({ a, start, col, cols, top, height }) => {
                    const status = a.status_agenda ?? "pendente";
                    const widthPct = 100 / cols;
                    const leftPct = widthPct * col;
                    return (
                      <div
                        key={a.id}
                        onClick={() => handleOpenEdit(a)}
                        className={cn(
                          "absolute rounded-xl border p-2 text-[11px] shadow-sm select-none transition flex flex-col justify-between overflow-hidden",
                          STATUS_STYLES[status]
                        )}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `calc(${leftPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                        }}
                      >
                        <div>
                          <p className="font-semibold truncate text-[12px] leading-tight mb-0.5">
                            {a.cliente_nome}
                          </p>
                          <p className="opacity-80 truncate text-[10px]">
                            {a.procedimento_nome}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[9px] opacity-60 font-mono mt-1">
                          <span className="uppercase tracking-wider font-semibold flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" />
                            {STATUS_LABEL[status]}
                          </span>

                          <span>
                            {String(start.getHours()).padStart(2, "0")}:
                            {String(start.getMinutes()).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-warning/20 border border-warning" /> Pendente
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-success/20 border border-success" /> Confirmado
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-danger/20 border border-danger" /> Reagendar
        </span>
      </div>

      {/* MODAL: NOVO AGENDAMENTO */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span>Novo Agendamento</span>
            </DialogTitle>
            <DialogDescription>
              Marque uma nova sessão de tratamento estético na agenda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPacNome">Nome do Paciente *</Label>
                <Input
                  id="newPacNome"
                  placeholder="Ex: Marina Silva"
                  value={newPacNome}
                  onChange={(e) => setNewPacNome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPacTel">Telefone / WhatsApp</Label>
                <Input
                  id="newPacTel"
                  placeholder="Ex: +55 11 98888-7777"
                  value={newPacTel}
                  onChange={(e) => setNewPacTel(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newProc">Procedimento *</Label>
                <Select value={newProcId} onValueChange={handleProcedureChange}>
                  <SelectTrigger id="newProc">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {procedimentos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newFunc">Profissional responsável</Label>
                <Select value={newFuncId} onValueChange={setNewFuncId}>
                  <SelectTrigger id="newFunc">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1.5">
                <Label htmlFor="newDate">Data *</Label>
                <Input
                  id="newDate"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newTime">Horário *</Label>
                <Input
                  id="newTime"
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newDuration">Duração (min)</Label>
                <Input
                  id="newDuration"
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newStatus">Status da Agenda</Label>
              <Select
                value={newStatus}
                onValueChange={(val) => setNewStatus(val as StatusAgenda)}
              >
                <SelectTrigger id="newStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente (Amarelo)</SelectItem>
                  <SelectItem value="confirmado">Confirmado (Verde)</SelectItem>
                  <SelectItem value="reagendar">Reagendar (Vermelho)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAppointment} disabled={!newPacNome.trim() || !newProcId || !newDate}>
              Salvar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR / GERENCIAR AGENDAMENTO */}
      <Dialog
        open={Boolean(selectedAgendamento)}
        onOpenChange={(o) => !o && setSelectedAgendamento(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" />
                <span>Gestão de Agendamento</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-danger hover:bg-danger/10 h-8 w-8 rounded-md"
                onClick={handleDelete}
                title="Excluir Agendamento"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Ajuste data, hora, profissional ou remova esta sessão de agendamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editPacNome">Nome do Paciente *</Label>
                <Input
                  id="editPacNome"
                  value={editPacNome}
                  onChange={(e) => setEditPacNome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPacTel">Telefone / WhatsApp</Label>
                <Input
                  id="editPacTel"
                  value={editPacTel}
                  onChange={(e) => setEditPacTel(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editProc">Procedimento *</Label>
                <Select value={editProcId} onValueChange={handleEditProcedureChange}>
                  <SelectTrigger id="editProc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {crmStore.getProcedimentos().map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editFunc">Profissional responsável</Label>
                <Select value={editFuncId} onValueChange={setEditFuncId}>
                  <SelectTrigger id="editFunc">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {crmStore.getFuncionarios().map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1.5">
                <Label htmlFor="editDate">Data *</Label>
                <Input
                  id="editDate"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTime">Horário *</Label>
                <Input
                  id="editTime"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDuration">Duração (min)</Label>
                <Input
                  id="editDuration"
                  type="number"
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editStatus">Status da Agenda</Label>
              <Select
                value={editStatus}
                onValueChange={(val) => setEditStatus(val as StatusAgenda)}
              >
                <SelectTrigger id="editStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente (Amarelo)</SelectItem>
                  <SelectItem value="confirmado">Confirmado (Verde)</SelectItem>
                  <SelectItem value="reagendar">Reagendar (Vermelho)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center w-full">
            <Button
              type="button"
              variant="destructive"
              className="mr-auto gap-1.5"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              <span>Apagar</span>
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedAgendamento(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={!editPacNome.trim() || !editProcId || !editDate}>
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
