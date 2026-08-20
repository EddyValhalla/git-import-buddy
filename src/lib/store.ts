import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Agendamento, Funcionario, Procedimento, Cliente, Mensagem } from "./types";

type Listener = () => void;
const listeners = new Set<Listener>();

// ---------------------------------------------------------------------------
// State (hydrated from the database)
// ---------------------------------------------------------------------------
let agendamentosState: Agendamento[] = [];
let funcionariosState: Funcionario[] = [];
let procedimentosState: Procedimento[] = [];
let clientesState: Cliente[] = [];
let mensagensState: Record<string, Mensagem[]> = {};
let loadedState = false;

// Prontuário / fotos remain local (no storage bucket configured yet)
let prontuariosState: Record<
  string,
  { alergias: string; medicamentos: string; gestante: string; cirurgias: string; observacoes: string }
> = {};

export interface Foto {
  id: string;
  url: string;
  size: number;
  originalSize: number;
}
let fotosState: Record<string, Foto[]> = {};

const notify = () => listeners.forEach((l) => l());

// ---------------------------------------------------------------------------
// Column whitelists — keep UI-only fields out of the database payloads
// ---------------------------------------------------------------------------
function pick<T extends object>(obj: T, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (k in obj) out[k] = (obj as Record<string, unknown>)[k];
  }
  return out;
}

const CLIENTE_COLS = [
  "nome",
  "telefone",
  "atendimento_ia",
  "setor",
  "origem",
  "temperatura",
  "aguardando_humano",
  "data_nascimento",
  "consentimento_marketing",
] as const;

const FUNCIONARIO_COLS = [
  "auth_user_id",
  "nome",
  "role",
  "ativo",
  "status",
  "procedimentos_habilitados",
] as const;

const PROCEDIMENTO_COLS = [
  "nome",
  "valor_sugerido",
  "duracao_minutos",
  "ativo",
  "status",
  "comissao_tipo",
  "comissao_valor",
] as const;

const AGENDAMENTO_COLS = [
  "cliente_id",
  "procedimento_id",
  "funcionario_id",
  "status_kanban",
  "status_agenda",
  "data_hora_inicio",
  "data_hora_fim",
  "data_retorno",
  "tipo_atendimento",
  "agendado_por_ia",
  "cliente_nome",
  "procedimento_nome",
  "duracao_minutos",
] as const;

function logError(scope: string, error: unknown) {
  if (error) console.error(`[crmStore] ${scope}`, error);
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const crmStore = {
  getAgendamentos: () => agendamentosState,
  getFuncionarios: () => funcionariosState,
  getProcedimentos: () => procedimentosState,
  getClientes: () => clientesState,
  getMensagens: () => mensagensState,
  getProntuarios: () => prontuariosState,
  getFotos: () => fotosState,
  getLoaded: () => loadedState,

  notify,
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },

  /** Load every CRM entity from the database. */
  loadAll: async () => {
    const [clientes, funcionarios, procedimentos, agendamentos, mensagens] = await Promise.all([
      supabase.from("clientes").select("*").order("created_at", { ascending: true }),
      supabase.from("funcionarios").select("*").order("nome", { ascending: true }),
      supabase.from("procedimentos").select("*").order("nome", { ascending: true }),
      supabase.from("agendamentos").select("*").order("data_hora_inicio", { ascending: true }),
      supabase.from("mensagens").select("*").order("timestamp", { ascending: true }),
    ]);

    logError("load clientes", clientes.error);
    logError("load funcionarios", funcionarios.error);
    logError("load procedimentos", procedimentos.error);
    logError("load agendamentos", agendamentos.error);
    logError("load mensagens", mensagens.error);

    clientesState = (clientes.data ?? []) as unknown as Cliente[];
    funcionariosState = (funcionarios.data ?? []) as unknown as Funcionario[];
    procedimentosState = (procedimentos.data ?? []) as unknown as Procedimento[];
    agendamentosState = (agendamentos.data ?? []) as unknown as Agendamento[];

    const grouped: Record<string, Mensagem[]> = {};
    for (const m of (mensagens.data ?? []) as unknown as Mensagem[]) {
      if (!m.cliente_id) continue;
      (grouped[m.cliente_id] ??= []).push(m);
    }
    mensagensState = grouped;

    loadedState = true;
    notify();
  },

  // ---------------- Agendamentos ----------------
  setAgendamentos: (next: Agendamento[]) => {
    const changed = next.filter((n) => {
      const prev = agendamentosState.find((a) => a.id === n.id);
      return prev && prev.status_kanban !== n.status_kanban;
    });
    agendamentosState = next;
    notify();
    for (const c of changed) {
      void supabase
        .from("agendamentos")
        .update({ status_kanban: c.status_kanban })
        .eq("id", c.id)
        .then(({ error }) => logError("update status_kanban", error));
    }
  },
  addAgendamento: (a: Omit<Agendamento, "id" | "updated_at">) => {
    const newA: Agendamento = { ...a, id: newId(), updated_at: new Date().toISOString() };
    agendamentosState = [...agendamentosState, newA];
    notify();
    void supabase
      .from("agendamentos")
      .insert({ id: newA.id, ...pick(newA, AGENDAMENTO_COLS) } as never)
      .then(({ error }) => logError("insert agendamento", error));
    return newA;
  },
  updateAgendamento: (id: string, patch: Partial<Agendamento>) => {
    agendamentosState = agendamentosState.map((a) =>
      a.id === id ? { ...a, ...patch, updated_at: new Date().toISOString() } : a
    );
    notify();
    const payload = pick(patch, AGENDAMENTO_COLS);
    if (Object.keys(payload).length === 0) return;
    void supabase
      .from("agendamentos")
      .update(payload as never)
      .eq("id", id)
      .then(({ error }) => logError("update agendamento", error));
  },
  deleteAgendamento: (id: string) => {
    agendamentosState = agendamentosState.filter((a) => a.id !== id);
    notify();
    void supabase
      .from("agendamentos")
      .delete()
      .eq("id", id)
      .then(({ error }) => logError("delete agendamento", error));
  },

  // ---------------- Funcionários ----------------
  setFuncionarios: (next: Funcionario[]) => {
    funcionariosState = next;
    notify();
  },
  addFuncionario: (f: Omit<Funcionario, "id">) => {
    const newF: Funcionario = { ...f, id: newId() };
    funcionariosState = [...funcionariosState, newF];
    notify();
    void supabase
      .from("funcionarios")
      .insert({ id: newF.id, ...pick(newF, FUNCIONARIO_COLS) } as never)
      .then(({ error }) => logError("insert funcionario", error));
    return newF;
  },
  updateFuncionario: (id: string, patch: Partial<Funcionario>) => {
    funcionariosState = funcionariosState.map((f) => (f.id === id ? { ...f, ...patch } : f));
    notify();
    const payload = pick(patch, FUNCIONARIO_COLS);
    if (Object.keys(payload).length === 0) return;
    void supabase
      .from("funcionarios")
      .update(payload as never)
      .eq("id", id)
      .then(({ error }) => logError("update funcionario", error));
  },

  // ---------------- Procedimentos ----------------
  setProcedimentos: (next: Procedimento[]) => {
    procedimentosState = next;
    notify();
  },
  addProcedimento: (p: Omit<Procedimento, "id">) => {
    const newP: Procedimento = { ...p, id: newId() };
    procedimentosState = [...procedimentosState, newP];
    notify();
    void supabase
      .from("procedimentos")
      .insert({ id: newP.id, ...pick(newP, PROCEDIMENTO_COLS) } as never)
      .then(({ error }) => logError("insert procedimento", error));
    return newP;
  },
  updateProcedimento: (id: string, patch: Partial<Procedimento>) => {
    procedimentosState = procedimentosState.map((p) => (p.id === id ? { ...p, ...patch } : p));
    notify();
    const payload = pick(patch, PROCEDIMENTO_COLS);
    if (Object.keys(payload).length === 0) return;
    void supabase
      .from("procedimentos")
      .update(payload as never)
      .eq("id", id)
      .then(({ error }) => logError("update procedimento", error));
  },

  // ---------------- Clientes ----------------
  addCliente: (c: Omit<Cliente, "id">) => {
    const newC: Cliente = { ...c, id: newId() };
    clientesState = [...clientesState, newC];
    notify();
    void supabase
      .from("clientes")
      .insert({ id: newC.id, ...pick(newC, CLIENTE_COLS) } as never)
      .then(({ error }) => logError("insert cliente", error));
    return newC;
  },
  updateCliente: (id: string, patch: Partial<Cliente>) => {
    clientesState = clientesState.map((c) => (c.id === id ? { ...c, ...patch } : c));
    notify();
    const payload = pick(patch, CLIENTE_COLS);
    if (Object.keys(payload).length === 0) return;
    void supabase
      .from("clientes")
      .update(payload as never)
      .eq("id", id)
      .then(({ error }) => logError("update cliente", error));
  },

  // ---------------- Mensagens ----------------
  addMensagem: (m: Omit<Mensagem, "id">) => {
    const newM: Mensagem = { ...m, id: newId() };
    mensagensState = {
      ...mensagensState,
      [newM.cliente_id]: [...(mensagensState[newM.cliente_id] ?? []), newM],
    };
    notify();
    void supabase
      .from("mensagens")
      .insert({
        id: newM.id,
        cliente_id: newM.cliente_id,
        remetente: newM.remetente,
        texto: newM.texto,
        timestamp: newM.timestamp,
      } as never)
      .then(({ error }) => logError("insert mensagem", error));
    return newM;
  },
  /** Applied by realtime — avoids duplicating locally-inserted rows. */
  upsertMensagemLocal: (m: Mensagem) => {
    const list = mensagensState[m.cliente_id] ?? [];
    if (list.some((x) => x.id === m.id)) return;
    mensagensState = { ...mensagensState, [m.cliente_id]: [...list, m] };
    notify();
  },
  upsertClienteLocal: (c: Cliente) => {
    const exists = clientesState.some((x) => x.id === c.id);
    clientesState = exists
      ? clientesState.map((x) => (x.id === c.id ? { ...x, ...c } : x))
      : [...clientesState, c];
    notify();
  },
  upsertAgendamentoLocal: (a: Agendamento) => {
    const exists = agendamentosState.some((x) => x.id === a.id);
    agendamentosState = exists
      ? agendamentosState.map((x) => (x.id === a.id ? { ...x, ...a } : x))
      : [...agendamentosState, a];
    notify();
  },
  removeAgendamentoLocal: (id: string) => {
    if (!agendamentosState.some((a) => a.id === id)) return;
    agendamentosState = agendamentosState.filter((a) => a.id !== id);
    notify();
  },

  // ---------------- Prontuários (local) ----------------
  updateProntuario: (
    clienteId: string,
    data: { alergias: string; medicamentos: string; gestante: string; cirurgias: string; observacoes: string }
  ) => {
    prontuariosState = { ...prontuariosState, [clienteId]: data };
    notify();
    void supabase
      .from("prontuarios")
      .upsert(
        {
          cliente_id: clienteId,
          alergias: data.alergias,
          medicamentos: data.medicamentos,
          gestante: data.gestante === "Sim",
          cirurgias: data.cirurgias,
          observacoes: data.observacoes,
        } as never,
        { onConflict: "cliente_id" } as never
      )
      .then(({ error }) => logError("upsert prontuario", error));
  },

  // ---------------- Fotos (local) ----------------
  addFoto: (clienteId: string, foto: Foto) => {
    fotosState = { ...fotosState, [clienteId]: [...(fotosState[clienteId] ?? []), foto] };
    notify();
  },
  deleteFoto: (clienteId: string, fotoId: string) => {
    fotosState = {
      ...fotosState,
      [clienteId]: (fotosState[clienteId] ?? []).filter((f) => f.id !== fotoId),
    };
    notify();
  },
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
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

export function useMensagens(): Record<string, Mensagem[]> {
  return useSyncExternalStore(crmStore.subscribe, crmStore.getMensagens, crmStore.getMensagens);
}

export function useProntuarios() {
  return useSyncExternalStore(crmStore.subscribe, crmStore.getProntuarios, crmStore.getProntuarios);
}

export function useFotos() {
  return useSyncExternalStore(crmStore.subscribe, crmStore.getFotos, crmStore.getFotos);
}

export function useCrmLoaded(): boolean {
  return useSyncExternalStore(crmStore.subscribe, crmStore.getLoaded, crmStore.getLoaded);
}

/**
 * Hydrates the store from the database once and keeps it in sync via realtime.
 * Mounted by ProtectedLayout.
 */
export function useCrmSync() {
  useEffect(() => {
    void crmStore.loadAll();

    const channel = supabase
      .channel("crm-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "mensagens" }, (payload) => {
        if (payload.eventType === "INSERT")
          crmStore.upsertMensagemLocal(payload.new as unknown as Mensagem);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "clientes" }, (payload) => {
        if (payload.eventType !== "DELETE")
          crmStore.upsertClienteLocal(payload.new as unknown as Cliente);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string } | null)?.id;
          if (id) crmStore.removeAgendamentoLocal(id);
        } else {
          crmStore.upsertAgendamentoLocal(payload.new as unknown as Agendamento);
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
}
