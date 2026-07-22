export type Role = "admin" | "atendente";

export interface Funcionario {
  id: string;
  auth_user_id?: string;
  nome: string;
  role: Role;
  ativo: boolean;
  status?: "ativo" | "pausado" | "inativo";
  procedimentos_habilitados?: string[];
}

export interface Procedimento {
  id: string;
  nome: string;
  valor_sugerido: number;
  duracao_minutos: number;
  ativo: boolean;
  status?: "ativo" | "pausado" | "em_falta";
  comissao_tipo?: "porcentagem" | "fixo";
  comissao_valor?: number;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  atendimento_ia: boolean;
  setor?: string;
  /** Origem do lead — canal de entrada */
  origem?: "whatsapp" | "instagram" | "presencial";
  /** IA sugeriu transbordo — aguardando intervenção humana */
  aguardando_humano?: boolean;
  /** Temperatura do lead */
  temperatura?: "QUENTE" | "MORNO" | "FRIO";
}

export interface Mensagem {
  id: string;
  cliente_id: string;
  remetente: "ia" | "cliente" | "humano";
  texto: string;
  timestamp: string;
}


/**
 * Novo funil simplificado com 4 estágios.
 * Migrado de: novo_lead | contato_feito | interesse | agendado | realizado | fidelizacao
 */
export type StatusKanban =
  | "novos_clientes"
  | "em_atendimento"
  | "agendado"
  | "concluido";

export type StatusAgenda = "pendente" | "confirmado" | "reagendar";

export interface Agendamento {
  id: string;
  cliente_id: string;
  procedimento_id: string;
  funcionario_id?: string;
  status_kanban: StatusKanban;
  status_agenda?: StatusAgenda;
  data_hora_inicio?: string;
  data_hora_fim?: string;
  profissional_responsavel?: string;
  lote_produto?: string;
  data_retorno?: string;
  /** Tipo de atendimento realizado */
  tipo_atendimento?: "humano" | "ia";
  /** Indica se o agendamento foi iniciado exclusivamente pela IA */
  agendado_por_ia?: boolean;
  // Denormalized for UI
  cliente_nome?: string;
  procedimento_nome?: string;
  /** Campo auxiliar para compatibilidade com modal de agenda */
  procedimento_name?: string;
  duracao_minutos?: number;
  updated_at?: string;
}

export interface FotoPaciente {
  id: string;
  cliente_id: string;
  url_foto: string;
  tipo: "antes" | "depois" | "evolucao";
  created_at?: string;
}
