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
  // ── Campos RFM (Fase 4) ──────────────────────────────
  /** Valor total gasto pelo cliente (soma dos procedimentos concluídos) */
  total_gasto?: number;
  /** Quantidade de procedimentos realizados */
  qtd_procedimentos?: number;
  /** Data/hora da última compra concluída */
  ultima_compra?: string;
  /** Ticket médio por procedimento */
  ticket_medio?: number;
  /** Segmento RFM calculado pelo trigger recalcular_rfm() */
  rfm_segmento?: RFMSegmento;
}

export type RFMSegmento =
  | "OURO"
  | "PRATA"
  | "EM_RISCO"
  | "PERDIDA"
  | "SEM_COMPRA";

export interface Mensagem {
  id: string;
  cliente_id: string;
  remetente: "ia" | "cliente" | "humano";
  texto: string;
  timestamp: string;
}

/**
 * Novo funil simplificado com 4 estágios.
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
  tipo_atendimento?: "humano" | "ia";
  agendado_por_ia?: boolean;
  cliente_nome?: string;
  procedimento_nome?: string;
  procedimento_name?: string;
  duracao_minutos?: number;
  updated_at?: string;
  confirmado?: boolean;
  confirmado_em?: string;
  lembrete_enviado?: boolean;
  token_agendamento?: string;
  origem_agendamento?: string;
}

export interface FotoPaciente {
  id: string;
  cliente_id: string;
  url_foto: string;
  tipo: "antes" | "depois" | "evolucao";
  created_at?: string;
}

export interface CrossellRegra {
  id: string;
  procedimento_origem_id: string | null;
  procedimento_sugerido_id: string | null;
  delay_dias: number;
  mensagem_template: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

// ── FASE 4 ────────────────────────────────────────────────────────────────────

/** Status do Carrinho */
export type StatusCarrinho = "PENSANDO" | "AGUARDANDO" | "CONVERTIDO" | "DESCARTADO";

/** Carrinho - Orçamentos em aberto e negociações */
export interface Carrinho {
  id: string;
  cliente_id: string;
  status: StatusCarrinho;
  procedimento_interesse: string | null;
  valor_estimado: number | null;
  motivo_interesse: string | null;
  mensagens_enviadas: number;
  ultima_mensagem_em: string | null;
  proxima_mensagem_em: string | null;
  intervalo_recaptura_dias: number;
  criado_em?: string;
  atualizado_em?: string;
  finalizado_por?: string | null;
  finalizado_em?: string | null;
  motivo_finalizacao?: string | null;
}

/** Pacote de Procedimentos */
export interface Pacote {
  id: string;
  cliente_id: string;
  nome: string;
  quantidade_sessoes: number;
  valor_total: number;
  status: "ATIVO" | "CONCLUIDO" | "CANCELADO";
  criado_em?: string;
  atualizado_em?: string;
}

/** Sessão individual dentro de um pacote */
export interface PacoteSessao {
  id: string;
  pacote_id: string;
  numero_sessao: number;
  procedimento_id: string | null;
  agendamento_id: string | null;
  status: "PENDENTE" | "AGENDADA" | "REALIZADA" | "FALTOU";
  realizada_em?: string | null;
  criado_em?: string;
  atualizado_em?: string;
}

/** Tipo de mensagem do fluxo de automação */
export type TipoMensagem =
  | "nutricao"
  | "checkin"
  | "crossell"
  | "risco"
  | "reposicao"
  | "lembrete";

/** Fluxo de automação pós-procedimento */
export interface FluxoAutomacao {
  id: string;
  procedimento_id: string | null;
  dia_offset: number;
  tipo_mensagem: TipoMensagem;
  template: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Status de uma campanha */
export type StatusCampanha = "agendada" | "enviada" | "cancelada" | "rascunho";

/** Campanha de marketing segmentada por RFM */
export interface Campanha {
  id: string;
  nome: string;
  data_disparo: string | null;
  segmento_alvo: RFMSegmento | null;
  template: string;
  status: StatusCampanha;
  created_at?: string;
  updated_at?: string;
}

/** Crédito giftback de um cliente */
export interface CreditoGiftback {
  id: string;
  cliente_id: string;
  valor: number;
  validade: string | null;
  created_at?: string;
}

/** Linha da view vw_rfm_segmentacao */
export interface RFMSegmentacao {
  id: string;
  nome: string;
  telefone: string;
  origem: string | null;
  temperatura: string | null;
  rfm_segmento: RFMSegmento | null;
  total_gasto: number | null;
  qtd_procedimentos: number | null;
  ultima_compra: string | null;
  ticket_medio: number | null;
  dias_sem_compra: number | null;
  ultimo_contato: string | null;
}

/** Linha da view vw_intervalo_medio_procedimento */
export interface IntervaloMedioProcedimento {
  procedimento_id: string;
  procedimento_nome: string;
  total_realizados: number;
  intervalo_medio_dias: number | null;
}

/** Linha da view vw_receita_recorrente_vs_nova */
export interface ReceitaRecorrenteVsNova {
  mes: string;
  receita_nova: number;
  receita_recorrente: number;
  receita_total: number;
  clientes_novos: number;
  clientes_recorrentes: number;
}

/** Horário de funcionamento de um dia da semana */
export interface HorarioFuncionamento {
  id: string;
  /** 0=Domingo, 1=Segunda ... 6=Sábado */
  dia_semana: number;
  aberto: boolean;
  hora_inicio: string | null; // "HH:MM"
  hora_fim: string | null;    // "HH:MM"
  criado_em?: string;
  atualizado_em?: string;
}
