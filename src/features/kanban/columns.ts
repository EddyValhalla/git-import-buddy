import type { StatusKanban } from "@/lib/types";

export const KANBAN_COLUMNS: { id: StatusKanban; label: string; hint: string }[] = [
  { id: "novos_clientes", label: "Novos Clientes", hint: "Leads recém-chegados" },
  { id: "em_atendimento", label: "Em Atendimento", hint: "Em conversa ativa" },
  { id: "agendado", label: "Agendado", hint: "Sessão confirmada" },
  { id: "concluido", label: "Concluído", hint: "Procedimento realizado" },
];
