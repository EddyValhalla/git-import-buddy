import { crmStore } from "@/lib/store";
import type { Agendamento } from "@/lib/types";

export interface ConflictResult {
  hasConflict: boolean;
  conflicting?: Agendamento;
  funcionarioNome?: string;
  message?: string;
}

function fmt(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Verifica se um novo/editado agendamento conflita com agendamentos existentes
 * do mesmo funcionário. Sobreposição = (novo_inicio < existente_fim) && (novo_fim > existente_inicio).
 */
export function checkScheduleConflict(params: {
  funcionario_id?: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  ignoreId?: string;
}): ConflictResult {
  const { funcionario_id, data_hora_inicio, data_hora_fim, ignoreId } = params;
  if (!funcionario_id) return { hasConflict: false };

  const newStart = new Date(data_hora_inicio).getTime();
  const newEnd = new Date(data_hora_fim).getTime();

  const agendamentos = crmStore.getAgendamentos();
  const conflicting = agendamentos.find((a) => {
    if (a.id === ignoreId) return false;
    if (a.funcionario_id !== funcionario_id) return false;
    if (!a.data_hora_inicio || !a.data_hora_fim) return false;
    const existStart = new Date(a.data_hora_inicio).getTime();
    const existEnd = new Date(a.data_hora_fim).getTime();
    return newStart < existEnd && newEnd > existStart;
  });

  if (!conflicting) return { hasConflict: false };

  const func = crmStore.getFuncionarios().find((f) => f.id === funcionario_id);
  const nome = func?.nome ?? "Profissional";
  return {
    hasConflict: true,
    conflicting,
    funcionarioNome: nome,
    message: `Conflito: ${nome} já tem um agendamento das ${fmt(
      conflicting.data_hora_inicio!
    )} às ${fmt(conflicting.data_hora_fim!)}. Escolha outro horário ou profissional.`,
  };
}
