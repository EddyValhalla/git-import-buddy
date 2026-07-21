import { useSyncExternalStore } from "react";
import type { Agendamento, Funcionario, Procedimento, Cliente } from "./types";
import { mockAgendamentos, mockFuncionarios, mockProcedimentos, mockClientes } from "./mockData";

type Listener = () => void;
const listeners = new Set<Listener>();

// Initializing states
let agendamentosState: Agendamento[] = mockAgendamentos;
let funcionariosState: Funcionario[] = mockFuncionarios.map((f) => ({
  ...f,
  status: f.ativo ? "ativo" : "inativo",
  procedimentos_habilitados: f.role === "admin" ? ["p1", "p2", "p3", "p4"] : ["p3"],
}));
let procedimentosState: Procedimento[] = mockProcedimentos.map((p) => ({
  ...p,
  status: p.ativo ? "ativo" : "pausado",
  comissao_tipo: "porcentagem" as const,
  comissao_valor: 18, // Default 18% commission
}));
let clientesState: Cliente[] = mockClientes;

// Persistent medical record (anamnese) state in memory
let prontuariosState: Record<
  string,
  { alergias: string; medicamentos: string; gestante: string; cirurgias: string; observacoes: string }
> = {
  c1: { alergias: "Dipirona", medicamentos: "Anticoncepcional", gestante: "Não", cirurgias: "Nenhuma", observacoes: "Pele sensível" },
  c2: { alergias: "Não relatadas", medicamentos: "Puran T4", gestante: "Não", cirurgias: "Rinoplastia", observacoes: "Aguardando retorno" },
};

// Patient photos state in memory
export interface Foto {
  id: string;
  url: string;
  size: number;
  originalSize: number;
}
let fotosState: Record<string, Foto[]> = {};

export const crmStore = {
  // Getters
  getAgendamentos: () => agendamentosState,
  getFuncionarios: () => funcionariosState,
  getProcedimentos: () => procedimentosState,
  getClientes: () => clientesState,
  getProntuarios: () => prontuariosState,
  getFotos: () => fotosState,

  notify: () => {
    listeners.forEach((l) => l());
  },
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },

  // Agendamento Actions
  setAgendamentos: (next: Agendamento[]) => {
    agendamentosState = next;
    crmStore.notify();
  },
  addAgendamento: (a: Omit<Agendamento, "id" | "updated_at">) => {
    const newA: Agendamento = {
      ...a,
      id: "a" + (agendamentosState.length + 1) + "_" + Math.random().toString(36).substring(2, 6),
      updated_at: new Date().toISOString(),
    };
    agendamentosState = [...agendamentosState, newA];
    crmStore.notify();
    return newA;
  },
  updateAgendamento: (id: string, patch: Partial<Agendamento>) => {
    agendamentosState = agendamentosState.map((a) =>
      a.id === id ? { ...a, ...patch, updated_at: new Date().toISOString() } : a
    );
    crmStore.notify();
  },
  deleteAgendamento: (id: string) => {
    agendamentosState = agendamentosState.filter((a) => a.id !== id);
    crmStore.notify();
  },

  // Funcionario Actions
  setFuncionarios: (next: Funcionario[]) => {
    funcionariosState = next;
    crmStore.notify();
  },
  addFuncionario: (f: Omit<Funcionario, "id">) => {
    const newF: Funcionario = {
      ...f,
      id: "f" + (funcionariosState.length + 1) + "_" + Math.random().toString(36).substring(2, 6),
    };
    funcionariosState = [...funcionariosState, newF];
    crmStore.notify();
    return newF;
  },
  updateFuncionario: (id: string, patch: Partial<Funcionario>) => {
    funcionariosState = funcionariosState.map((f) =>
      f.id === id ? { ...f, ...patch } : f
    );
    crmStore.notify();
  },

  // Procedimento Actions
  setProcedimentos: (next: Procedimento[]) => {
    procedimentosState = next;
    crmStore.notify();
  },
  addProcedimento: (p: Omit<Procedimento, "id">) => {
    const newP: Procedimento = {
      ...p,
      id: "p" + (procedimentosState.length + 1) + "_" + Math.random().toString(36).substring(2, 6),
    };
    procedimentosState = [...procedimentosState, newP];
    crmStore.notify();
    return newP;
  },
  updateProcedimento: (id: string, patch: Partial<Procedimento>) => {
    procedimentosState = procedimentosState.map((p) =>
      p.id === id ? { ...p, ...patch } : p
    );
    crmStore.notify();
  },

  // Cliente Actions
  addCliente: (c: Omit<Cliente, "id">) => {
    const newC: Cliente = {
      ...c,
      id: "c" + (clientesState.length + 1) + "_" + Math.random().toString(36).substring(2, 6),
    };
    clientesState = [...clientesState, newC];
    crmStore.notify();
    return newC;
  },
  updateCliente: (id: string, patch: Partial<Cliente>) => {
    clientesState = clientesState.map((c) => (c.id === id ? { ...c, ...patch } : c));
    crmStore.notify();
  },

  // Prontuario Actions
  updateProntuario: (
    clienteId: string,
    data: { alergias: string; medicamentos: string; gestante: string; cirurgias: string; observacoes: string }
  ) => {
    prontuariosState = {
      ...prontuariosState,
      [clienteId]: data,
    };
    crmStore.notify();
  },

  // Fotos Actions
  addFoto: (clienteId: string, foto: Foto) => {
    fotosState = {
      ...fotosState,
      [clienteId]: [...(fotosState[clienteId] ?? []), foto],
    };
    crmStore.notify();
  },
  deleteFoto: (clienteId: string, fotoId: string) => {
    fotosState = {
      ...fotosState,
      [clienteId]: (fotosState[clienteId] ?? []).filter((f) => f.id !== fotoId),
    };
    crmStore.notify();
  },
};

// React Hooks for global usage
export function useAgendamentos(): Agendamento[] {
  return useSyncExternalStore(crmStore.subscribe, crmStore.getAgendamentos, crmStore.getAgendamentos);
}

export function useFuncionarios(): Funcionario[] {
  return useSyncExternalStore(crmStore.subscribe, crmStore.getFuncionarios, crmStore.getFuncionarios);
}

export function useProcedimentos(): Procedimento[] {
  return useSyncExternalStore(crmStore.subscribe, crmStore.getProcedimentos, crmStore.getProcedimentos);
}

export function useClientes(): Cliente[] {
  return useSyncExternalStore(crmStore.subscribe, crmStore.getClientes, crmStore.getClientes);
}

export function useProntuarios() {
  return useSyncExternalStore(crmStore.subscribe, crmStore.getProntuarios, crmStore.getProntuarios);
}

export function useFotos() {
  return useSyncExternalStore(crmStore.subscribe, crmStore.getFotos, crmStore.getFotos);
}
