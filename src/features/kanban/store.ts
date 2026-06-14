import { crmStore, useAgendamentos } from "@/lib/store";
import type { Agendamento } from "@/lib/types";

export const kanbanStore = {
  get: () => crmStore.getAgendamentos(),
  set: (next: Agendamento[]) => {
    crmStore.setAgendamentos(next);
  },
  subscribe: (l: () => void) => {
    return crmStore.subscribe(l);
  },
};

export function useKanbanCards(): Agendamento[] {
  return useAgendamentos();
}
