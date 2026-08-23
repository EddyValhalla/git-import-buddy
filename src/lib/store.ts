import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Agendamento,
  Funcionario,
  Procedimento,
  Cliente,
  Mensagem,
  CrossellRegra,
} from "./types";
import {
  mockAgendamentos,
  mockFuncionarios,
  mockProcedimentos,
  mockClientes,
} from "./mockData";

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
let crossellState: CrossellRegra[] = [];
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
  getCrossell: () => crossellState,
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

  /** Carrega todas as entidades do CRM do banco de dados.
   * Em caso de falha (ex: sem conexão ou env não configurado),
   * usa mockData para que o UI não fique em branco durante dev. */
  loadAll: async () => {
    try {
      const [clientes, funcionarios, procedimentos, agendamentos, mensagens, crossell] =
        await Promise.all([
          supabase.from("clientes").select("*").order("created_at", { ascending: true }),
          supabase.from("funcionarios").select("*").order("nome", { ascending: true }),
          supabase.from("procedimentos").select("*").order("nome", { ascending: true }),
          supabase.from("agendamentos").select("*").order("data_hora_inicio", { ascending: true }),
          supabase.from("mensagens").select("*").order("timestamp", { ascending: true }),
          supabase.from("crossell_matriz").select("*").order("created_at", { ascending: true }),
        ]);

      logError("load clientes", clientes.error);
      logError("load funcionarios", funcionarios.error);
      logError("load procedimentos", procedimentos.error);
      logError("load agendamentos", agendamentos.error);
      logError("load mensagens", mensagens.error);
      logError("load crossell", crossell.error);

      // Usa dados do banco se veio sem erro; caso contrário mantém estado atual
      clientesState = (clientes.data ?? clientesState) as unknown as Cliente[];
      funcionariosState = (funcionarios.data ?? funcionariosState) as unknown as Funcionario[];
      procedimentosState = (procedimentos.data ?? procedimentosState) as unknown as Procedimento[];
      agendamentosState = (agendamentos.data ?? agendamentosState) as unknown as Agendamento[];
      crossellState = (crossell.data ?? crossellState) as unknown as CrossellRegra[];

      const grouped: Record<string, Mensagem[]> = {};
      for (const m of (mensagens.data ?? []) as unknown as Mensagem[]) {
        if (!m.cliente_id) continue;
        (grouped[m.cliente_id] ??= []).push(m);
      }
      mensagensState = grouped;
    } catch (err) {
      // Fallback para mockData em caso de erro de configuração (dev sem .env.local)
      console.warn("[crmStore] Falha ao conectar Supabase — usando mockData:", err);
      if (clientesState.length === 0) clientesState = mockClientes;
      if (funcionariosState.length === 0) funcionariosState = mockFuncionarios;
      if (procedimentosState.length === 0) procedimentosState = mockProcedimentos;
      if (agendamentosState.length === 0) agendamentosState = mockAgendamentos;
    }

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

  // ---------------- Crossell ----------------
  addCrossell: (r: Omit<CrossellRegra, "id">) => {
    const newR: CrossellRegra = { ...r, id: newId() };
    crossellState = [...crossellState, newR];
    notify();
    void supabase
      .from("crossell_matriz")
      .insert({
        id: newR.id,
        procedimento_origem_id: newR.procedimento_origem_id,
        procedimento_sugerido_id: newR.procedimento_sugerido_id,
        delay_dias: newR.delay_dias,
        mensagem_template: newR.mensagem_template,
        ativo: newR.ativo,
      } as never)
      .then(({ error }) => logError("insert crossell", error));
    return newR;
  },
  updateCrossell: (id: string, patch: Partial<CrossellRegra>) => {
    crossellState = crossellState.map((r) => (r.id === id ? { ...r, ...patch } : r));
    notify();
    const payload = pick(patch, [
      "procedimento_origem_id",
      "procedimento_sugerido_id",
      "delay_dias",
      "mensagem_template",
      "ativo",
    ]);
    if (Object.keys(payload).length === 0) return;
    void supabase
      .from("crossell_matriz")
      .update(payload as never)
      .eq("id", id)
      .then(({ error }) => logError("update crossell", error));
  },
  deleteCrossell: (id: string) => {
    crossellState = crossellState.filter((r) => r.id !== id);
    notify();
    void supabase
      .from("crossell_matriz")
      .delete()
      .eq("id", id)
      .then(({ error }) => logError("delete crossell", error));
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

/** Retorna o mapa completo de mensagens { clienteId -> Mensagem[] } */
export function useMensagens(): Record<string, Mensagem[]>;
/** Retorna as mensagens de um cliente específico, ordenadas por timestamp */
export function useMensagens(clienteId: string): Mensagem[];
export function useMensagens(clienteId?: string): Record<string, Mensagem[]> | Mensagem[] {
  const all = useSyncExternalStore(crmStore.subscribe, crmStore.getMensagens, crmStore.getMensagens);
  if (clienteId === undefined) return all;
  // Filtra e ordena por timestamp para o chat do Atendimento
  return (all[clienteId] ?? []).slice().sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
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

export function useCrossell(): CrossellRegra[] {
  return useSyncExternalStore(crmStore.subscribe, crmStore.getCrossell, crmStore.getCrossell);
}

// ── HOOKS FASE 4 (consultam diretamente o Supabase) ──────────────────────────
// Importados aqui para evitar dependência circular com store principal.
import { useState } from "react";
import type {
  FluxoAutomacao,
  Campanha,
  CreditoGiftback,
  RFMSegmentacao,
  IntervaloMedioProcedimento,
  ReceitaRecorrenteVsNova,
} from "./types";

/** Lê a view vw_rfm_segmentacao e retorna { data, loading, error, refetch } */
export function useRFMSegmentacao() {
  const [data, setData] = useState<RFMSegmentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from("vw_rfm_segmentacao")
        .select("*");
      if (err) throw err;
      setData((rows ?? []) as unknown as RFMSegmentacao[]);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetch(); }, []);
  return { data, loading, error, refetch: fetch };
}

/** CRUD completo para fluxos_automacao */
export function useFluxosAutomacao() {
  const [data, setData] = useState<FluxoAutomacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from("fluxos_automacao")
        .select("*")
        .order("dia_offset", { ascending: true });
      if (err) throw err;
      setData((rows ?? []) as unknown as FluxoAutomacao[]);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const add = async (payload: Omit<FluxoAutomacao, "id" | "created_at" | "updated_at">) => {
    const { data: row, error: err } = await supabase
      .from("fluxos_automacao")
      .insert(payload as never)
      .select()
      .single();
    if (err) throw err;
    setData((prev) => [...prev, row as unknown as FluxoAutomacao]);
    return row;
  };

  const update = async (id: string, patch: Partial<FluxoAutomacao>) => {
    const { error: err } = await supabase
      .from("fluxos_automacao")
      .update(patch as never)
      .eq("id", id);
    if (err) throw err;
    setData((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const remove = async (id: string) => {
    const { error: err } = await supabase
      .from("fluxos_automacao")
      .delete()
      .eq("id", id);
    if (err) throw err;
    setData((prev) => prev.filter((f) => f.id !== id));
  };

  useEffect(() => { void fetch(); }, []);
  return { data, loading, error, refetch: fetch, add, update, remove };
}

/** CRUD completo para campanhas */
export function useCampanhas() {
  const [data, setData] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from("campanhas")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      setData((rows ?? []) as unknown as Campanha[]);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const add = async (payload: Omit<Campanha, "id" | "created_at" | "updated_at">) => {
    const { data: row, error: err } = await supabase
      .from("campanhas")
      .insert(payload as never)
      .select()
      .single();
    if (err) throw err;
    setData((prev) => [row as unknown as Campanha, ...prev]);
    return row;
  };

  const update = async (id: string, patch: Partial<Campanha>) => {
    const { error: err } = await supabase
      .from("campanhas")
      .update(patch as never)
      .eq("id", id);
    if (err) throw err;
    setData((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const remove = async (id: string) => {
    const { error: err } = await supabase
      .from("campanhas")
      .delete()
      .eq("id", id);
    if (err) throw err;
    setData((prev) => prev.filter((c) => c.id !== id));
  };

  useEffect(() => { void fetch(); }, []);
  return { data, loading, error, refetch: fetch, add, update, remove };
}

/** Créditos giftback de um cliente específico */
export function useCreditosCliente(clienteId: string) {
  const [data, setData] = useState<CreditoGiftback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from("credito_giftback")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false })
      .then(({ data: rows }) => {
        setData((rows ?? []) as unknown as CreditoGiftback[]);
        setLoading(false);
      });
  }, [clienteId]);

  return { data, loading };
}

/** Lê a view vw_intervalo_medio_procedimento */
export function useIntervaloMedio() {
  const [data, setData] = useState<IntervaloMedioProcedimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("vw_intervalo_medio_procedimento")
      .select("*")
      .then(({ data: rows, error: err }) => {
        if (err) setError(String(err));
        setData((rows ?? []) as unknown as IntervaloMedioProcedimento[]);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

/** Lê a view vw_receita_recorrente_vs_nova */
export function useReceitaRecorrente() {
  const [data, setData] = useState<ReceitaRecorrenteVsNova[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("vw_receita_recorrente_vs_nova")
      .select("*")
      .order("mes", { ascending: false })
      .then(({ data: rows, error: err }) => {
        if (err) setError(String(err));
        setData((rows ?? []) as unknown as ReceitaRecorrenteVsNova[]);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
