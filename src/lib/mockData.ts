import type {
  Agendamento,
  Cliente,
  FotoPaciente,
  Funcionario,
  Procedimento,
} from "./types";

export const mockFuncionarios: Funcionario[] = [
  { id: "f1", nome: "Isabella Moreau", role: "admin", ativo: true },
  { id: "f2", nome: "Camila Duarte", role: "atendente", ativo: true },
  { id: "f3", nome: "Dra. Helena Costa", role: "admin", ativo: true },
];

export const mockProcedimentos: Procedimento[] = [
  { id: "p1", nome: "Toxina Botulínica", valor_sugerido: 1800, duracao_minutos: 45, ativo: true },
  { id: "p2", nome: "Preenchimento Labial", valor_sugerido: 2400, duracao_minutos: 60, ativo: true },
  { id: "p3", nome: "Limpeza de Pele Premium", valor_sugerido: 480, duracao_minutos: 90, ativo: true },
  { id: "p4", nome: "Bioestimulador Sculptra", valor_sugerido: 3600, duracao_minutos: 75, ativo: true },
  { id: "p5", nome: "Drenagem Linfática", valor_sugerido: 280, duracao_minutos: 60, ativo: false },
];

export const mockClientes: Cliente[] = [
  { id: "c1", nome: "Marina Albuquerque", telefone: "+55 11 99988-1122", atendimento_ia: true, setor: "VIP", origem: "instagram", temperatura: "QUENTE" },
  { id: "c2", nome: "Sofia Bertolini", telefone: "+55 11 98877-2233", atendimento_ia: false, setor: "Premium", origem: "whatsapp", temperatura: "MORNO" },
  { id: "c3", nome: "Renata Vasconcellos", telefone: "+55 11 97766-3344", atendimento_ia: true, setor: "VIP", origem: "instagram", aguardando_humano: true, temperatura: "QUENTE" },
  { id: "c4", nome: "Luiza Carvalho", telefone: "+55 11 96655-4455", atendimento_ia: false, origem: "whatsapp", temperatura: "FRIO" },
  { id: "c5", nome: "Beatriz Sanford", telefone: "+55 11 95544-5566", atendimento_ia: true, setor: "Premium", origem: "instagram", temperatura: "MORNO" },
  { id: "c6", nome: "Helena Drummond", telefone: "+55 11 94433-6677", atendimento_ia: false, origem: "whatsapp", temperatura: "QUENTE" },
  { id: "c7", nome: "Ana Lívia Castro", telefone: "+55 11 93322-7788", atendimento_ia: true, origem: "whatsapp", temperatura: "MORNO" },
  { id: "c8", nome: "Mariana Toledo", telefone: "+55 11 92211-8899", atendimento_ia: false, setor: "VIP", origem: "instagram", temperatura: "FRIO" },
  { id: "c9", nome: "Fernanda Lopes", telefone: "+55 11 91100-9900", atendimento_ia: true, origem: "instagram", aguardando_humano: true, temperatura: "QUENTE" },
  { id: "c10", nome: "Juliana Ramos", telefone: "+55 11 90099-8811", atendimento_ia: false, origem: "whatsapp" },
];


const now = new Date();
const iso = (d: Date) => d.toISOString();
const addMin = (base: Date, m: number) => new Date(base.getTime() + m * 60000);
// Helper: create a date at a specific hour today
const todayAt = (h: number, m = 0) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
// Helper: past month date
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000);

export const mockAgendamentos: Agendamento[] = [
  // --- NOVOS CLIENTES (leads recém-chegados) ---
  {
    id: "a1", cliente_id: "c1", procedimento_id: "p1",
    status_kanban: "novos_clientes", cliente_nome: "Marina Albuquerque",
    procedimento_nome: "Toxina Botulínica", duracao_minutos: 45,
    tipo_atendimento: "ia", agendado_por_ia: false,
    updated_at: iso(now),
  },
  {
    id: "a2", cliente_id: "c2", procedimento_id: "p2",
    status_kanban: "novos_clientes", cliente_nome: "Sofia Bertolini",
    procedimento_nome: "Preenchimento Labial", duracao_minutos: 60,
    tipo_atendimento: "humano", agendado_por_ia: false,
    updated_at: iso(now),
  },
  // --- EM ATENDIMENTO ---
  {
    id: "a3", cliente_id: "c3", procedimento_id: "p4",
    status_kanban: "em_atendimento", cliente_nome: "Renata Vasconcellos",
    procedimento_nome: "Bioestimulador Sculptra", duracao_minutos: 75,
    tipo_atendimento: "ia", agendado_por_ia: false,
    updated_at: iso(daysAgo(2)),
  },
  {
    id: "a4", cliente_id: "c4", procedimento_id: "p3",
    status_kanban: "em_atendimento", cliente_nome: "Luiza Carvalho",
    procedimento_nome: "Limpeza de Pele Premium", duracao_minutos: 90,
    tipo_atendimento: "humano", agendado_por_ia: false,
    updated_at: iso(daysAgo(1)),
  },
  // --- AGENDADOS (com horários hoje para aparecerem no dashboard) ---
  {
    id: "a5", cliente_id: "c5", procedimento_id: "p1", funcionario_id: "f3",
    status_kanban: "agendado", status_agenda: "confirmado",
    cliente_nome: "Beatriz Sanford", procedimento_nome: "Toxina Botulínica",
    duracao_minutos: 45,
    tipo_atendimento: "ia", agendado_por_ia: true,
    data_hora_inicio: iso(todayAt(10, 0)),
    data_hora_fim: iso(addMin(todayAt(10, 0), 45)),
    updated_at: iso(now),
  },
  {
    id: "a6", cliente_id: "c6", procedimento_id: "p2", funcionario_id: "f3",
    status_kanban: "agendado", status_agenda: "pendente",
    cliente_nome: "Helena Drummond", procedimento_nome: "Preenchimento Labial",
    duracao_minutos: 60,
    tipo_atendimento: "humano", agendado_por_ia: false,
    data_hora_inicio: iso(todayAt(14, 0)),
    data_hora_fim: iso(addMin(todayAt(14, 0), 60)),
    updated_at: iso(now),
  },
  {
    id: "a9", cliente_id: "c9", procedimento_id: "p3", funcionario_id: "f2",
    status_kanban: "agendado", status_agenda: "confirmado",
    cliente_nome: "Fernanda Lopes", procedimento_nome: "Limpeza de Pele Premium",
    duracao_minutos: 90,
    tipo_atendimento: "ia", agendado_por_ia: true,
    data_hora_inicio: iso(todayAt(11, 30)),
    data_hora_fim: iso(addMin(todayAt(11, 30), 90)),
    updated_at: iso(now),
  },
  {
    id: "a10", cliente_id: "c10", procedimento_id: "p4", funcionario_id: "f3",
    status_kanban: "agendado", status_agenda: "pendente",
    cliente_nome: "Juliana Ramos", procedimento_nome: "Bioestimulador Sculptra",
    duracao_minutos: 75,
    tipo_atendimento: "humano", agendado_por_ia: false,
    data_hora_inicio: iso(todayAt(16, 0)),
    data_hora_fim: iso(addMin(todayAt(16, 0), 75)),
    updated_at: iso(now),
  },
  // --- CONCLUÍDOS (para métricas mensais de faturamento) ---
  {
    id: "a7", cliente_id: "c7", procedimento_id: "p3",
    status_kanban: "concluido", cliente_nome: "Ana Lívia Castro",
    procedimento_nome: "Limpeza de Pele Premium", duracao_minutos: 90,
    tipo_atendimento: "ia", agendado_por_ia: true,
    updated_at: iso(daysAgo(5)),
  },
  {
    id: "a8", cliente_id: "c8", procedimento_id: "p1",
    status_kanban: "concluido", cliente_nome: "Mariana Toledo",
    procedimento_nome: "Toxina Botulínica", duracao_minutos: 45,
    tipo_atendimento: "humano", agendado_por_ia: false,
    updated_at: iso(daysAgo(3)),
  },
  // Concluídos do mês para relatório mensal
  {
    id: "a11", cliente_id: "c1", procedimento_id: "p2",
    status_kanban: "concluido", cliente_nome: "Marina Albuquerque",
    procedimento_nome: "Preenchimento Labial", duracao_minutos: 60,
    tipo_atendimento: "ia", agendado_por_ia: true,
    updated_at: iso(daysAgo(10)),
  },
  {
    id: "a12", cliente_id: "c3", procedimento_id: "p4",
    status_kanban: "concluido", cliente_nome: "Renata Vasconcellos",
    procedimento_nome: "Bioestimulador Sculptra", duracao_minutos: 75,
    tipo_atendimento: "ia", agendado_por_ia: true,
    updated_at: iso(daysAgo(15)),
  },
  {
    id: "a13", cliente_id: "c5", procedimento_id: "p1",
    status_kanban: "concluido", cliente_nome: "Beatriz Sanford",
    procedimento_nome: "Toxina Botulínica", duracao_minutos: 45,
    tipo_atendimento: "humano", agendado_por_ia: false,
    updated_at: iso(daysAgo(20)),
  },
];

export const mockFotos: FotoPaciente[] = [];
