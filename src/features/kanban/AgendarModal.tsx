import { useState, useEffect } from "react";
import { CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProcedimentos, useFuncionarios, useClientes } from "@/lib/store";
import { checkScheduleConflict } from "@/lib/scheduleConflict";
import { toast } from "sonner";
import type { Agendamento, StatusAgenda } from "@/lib/types";


interface AgendarModalProps {
  open: boolean;
  /** Card que foi arrastado para a coluna "Agendado" */
  card: Agendamento | null;
  /** Chamado quando o usuário salva — card é confirmado na coluna */
  onSave: (data: {
    data_hora_inicio: string;
    data_hora_fim: string;
    funcionario_id?: string;
    status_agenda: StatusAgenda;
  }) => void;
  /** Chamado quando o usuário cancela/fecha — card é revertido */
  onCancel: () => void;
}

export function AgendarModal({ open, card, onSave, onCancel }: AgendarModalProps) {
  const procedimentos = useProcedimentos();
  const funcionarios = useFuncionarios().filter((f) => f.status === "ativo");
  const clientes = useClientes();

  // Form state
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [funcId, setFuncId] = useState("");
  const [status, setStatus] = useState<StatusAgenda>("pendente");

  // Pré-preencher com dados do card quando abrir
  useEffect(() => {
    if (!open || !card) return;

    setNome(card.cliente_nome ?? "");
    setDate(new Date().toISOString().split("T")[0]);
    setTime("10:00");
    setStatus("pendente");

    if (funcionarios.length > 0 && !card.funcionario_id) {
      setFuncId(funcionarios[0].id);
    } else {
      setFuncId(card.funcionario_id ?? "");
    }

    // Buscar telefone do cliente no store
    const cliente = clientes.find((c) => c.id === card.cliente_id);
    setTelefone(cliente?.telefone ?? "");
  }, [open, card]);

  const procedimento = procedimentos.find((p) => p.id === card?.procedimento_id);
  const duracao = card?.duracao_minutos ?? procedimento?.duracao_minutos ?? 45;

  const handleSave = () => {
    if (!date || !time) return;

    const startStr = `${date}T${time}:00`;
    const start = new Date(startStr);
    const end = new Date(start.getTime() + duracao * 60000);

    // Verifica conflito antes de salvar; se houver, mantém o modal aberto
    const conflict = checkScheduleConflict({
      funcionario_id: funcId || undefined,
      data_hora_inicio: start.toISOString(),
      data_hora_fim: end.toISOString(),
      ignoreId: card?.id,
    });
    if (conflict.hasConflict) {
      toast.error(conflict.message!);
      return;
    }

    onSave({
      data_hora_inicio: start.toISOString(),
      data_hora_fim: end.toISOString(),
      funcionario_id: funcId || undefined,
      status_agenda: status,
    });
  };


  const canSave = Boolean(date && time && nome.trim());

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span>Confirmar Agendamento</span>
          </DialogTitle>
          <DialogDescription>
            Defina data e hora para confirmar o agendamento do cliente na agenda.
          </DialogDescription>
        </DialogHeader>

        {/* Badge do procedimento */}
        {procedimento && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 border border-primary/20">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Procedimento:
            </span>
            <span className="text-xs font-semibold text-foreground">
              {procedimento.nome}
            </span>
            <span className="ml-auto text-[11px] text-muted-foreground">
              {duracao} min
            </span>
          </div>
        )}

        <div className="space-y-4 py-1">
          {/* Nome (pré-preenchido, editável) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="agendar-nome">Nome do Paciente *</Label>
              <Input
                id="agendar-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agendar-tel">Telefone / WhatsApp</Label>
              <Input
                id="agendar-tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="+55 11 99999-8888"
              />
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="agendar-date">Data *</Label>
              <Input
                id="agendar-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agendar-time">Horário *</Label>
              <Input
                id="agendar-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Profissional */}
          {funcionarios.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="agendar-func">Profissional Responsável</Label>
              <Select value={funcId} onValueChange={setFuncId}>
                <SelectTrigger id="agendar-func">
                  <SelectValue placeholder="Selecione um profissional" />
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
          )}

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="agendar-status">Status da Agenda</Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as StatusAgenda)}
            >
              <SelectTrigger id="agendar-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente (Aguardando confirmação)</SelectItem>
                <SelectItem value="confirmado">Confirmado ✓</SelectItem>
                <SelectItem value="reagendar">Reagendar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Salvar Agendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
