-- 1. CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT UNIQUE NOT NULL,
  atendimento_ia BOOLEAN DEFAULT true,
  setor TEXT CHECK (setor IN ('AGENDAMENTO_CONSULTAS', 'DUVIDAS_TECNICAS', 'FINANCEIRO_PAGAMENTOS', 'RECEPCAO')),
  origem TEXT CHECK (origem IN ('whatsapp', 'instagram', 'presencial')),
  temperatura TEXT CHECK (temperatura IN ('QUENTE', 'MORNO', 'FRIO')),
  aguardando_humano BOOLEAN DEFAULT false,
  data_nascimento DATE,
  consentimento_marketing BOOLEAN DEFAULT false,
  ultima_interacao TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. FUNCIONARIOS
CREATE TABLE IF NOT EXISTS public.funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  role TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'disponivel',
  procedimentos_habilitados TEXT[] DEFAULT '{}'
);

-- 3. PROCEDIMENTOS
CREATE TABLE IF NOT EXISTS public.procedimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  valor_sugerido NUMERIC(10,2),
  duracao_minutos INTEGER,
  ativo BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'ativo',
  comissao_tipo TEXT CHECK (comissao_tipo IN ('percentual', 'fixo')),
  comissao_valor NUMERIC(10,2)
);

-- 4. AGENDAMENTOS
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  procedimento_id UUID REFERENCES public.procedimentos(id) ON DELETE SET NULL,
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  status_kanban TEXT CHECK (status_kanban IN ('novos_clientes', 'em_atendimento', 'agendado', 'concluido')) DEFAULT 'novos_clientes',
  status_agenda TEXT CHECK (status_agenda IN ('confirmado', 'pendente', 'cancelado', 'compareceu', 'nao_compareceu')) DEFAULT 'pendente',
  data_hora_inicio TIMESTAMPTZ NOT NULL,
  data_hora_fim TIMESTAMPTZ,
  data_retorno DATE,
  tipo_atendimento TEXT DEFAULT 'presencial',
  agendado_por_ia BOOLEAN DEFAULT false,
  cliente_nome TEXT,
  procedimento_nome TEXT,
  duracao_minutos INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. MENSAGENS
CREATE TABLE IF NOT EXISTS public.mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  remetente TEXT CHECK (remetente IN ('ia', 'cliente', 'humano')) NOT NULL,
  texto TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 6. FOTOS PACIENTE
CREATE TABLE IF NOT EXISTS public.fotos_paciente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  url_foto TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('antes', 'depois', 'evolucao')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PRONTUARIOS
CREATE TABLE IF NOT EXISTS public.prontuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  alergias TEXT,
  medicamentos TEXT,
  gestante BOOLEAN DEFAULT false,
  cirurgias TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funcionarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.procedimentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensagens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fotos_paciente TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prontuarios TO authenticated;
GRANT ALL ON public.clientes, public.funcionarios, public.procedimentos, public.agendamentos, public.mensagens, public.fotos_paciente, public.prontuarios TO service_role;

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON public.clientes;
CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_prontuarios_updated_at ON public.prontuarios;
CREATE TRIGGER trg_prontuarios_updated_at BEFORE UPDATE ON public.prontuarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.update_cliente_interacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clientes SET ultima_interacao = now() WHERE id = NEW.cliente_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mensagens_cliente_interacao ON public.mensagens;
CREATE TRIGGER trg_mensagens_cliente_interacao
  AFTER INSERT ON public.mensagens
  FOR EACH ROW EXECUTE FUNCTION public.update_cliente_interacao();

-- RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_paciente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated manage clientes" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated manage funcionarios" ON public.funcionarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated manage procedimentos" ON public.procedimentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated manage agendamentos" ON public.agendamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated manage mensagens" ON public.mensagens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated manage fotos_paciente" ON public.fotos_paciente FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated manage prontuarios" ON public.prontuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- VIEWS (security_invoker respeita RLS do usuário)
CREATE OR REPLACE VIEW public.vw_agendamentos_hoje WITH (security_invoker = true) AS
SELECT a.*, c.nome AS cliente_nome_real, c.telefone, p.nome AS procedimento_nome_real
FROM public.agendamentos a
JOIN public.clientes c ON a.cliente_id = c.id
LEFT JOIN public.procedimentos p ON a.procedimento_id = p.id
WHERE DATE(a.data_hora_inicio) = CURRENT_DATE
ORDER BY a.data_hora_inicio;

CREATE OR REPLACE VIEW public.vw_aniversariantes_mes WITH (security_invoker = true) AS
SELECT id, nome, telefone, data_nascimento
FROM public.clientes
WHERE EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND data_nascimento IS NOT NULL
ORDER BY EXTRACT(DAY FROM data_nascimento);

CREATE OR REPLACE VIEW public.vw_retornos_proximos WITH (security_invoker = true) AS
SELECT a.id, a.cliente_id, c.nome AS cliente_nome, c.telefone, a.data_retorno, a.procedimento_nome
FROM public.agendamentos a
JOIN public.clientes c ON a.cliente_id = c.id
WHERE a.data_retorno IS NOT NULL
  AND a.data_retorno BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY a.data_retorno;

CREATE OR REPLACE VIEW public.vw_leads_frios WITH (security_invoker = true) AS
SELECT id, nome, telefone, origem, ultima_interacao, created_at
FROM public.clientes
WHERE temperatura = 'FRIO'
  AND aguardando_humano = false
ORDER BY ultima_interacao DESC;

CREATE OR REPLACE VIEW public.vw_resumo_mensal WITH (security_invoker = true) AS
SELECT
  DATE_TRUNC('month', data_hora_inicio) AS mes,
  COUNT(*) AS total_agendamentos,
  COUNT(*) FILTER (WHERE status_agenda = 'compareceu') AS compareceram,
  COUNT(*) FILTER (WHERE status_agenda = 'nao_compareceu') AS nao_compareceram,
  COUNT(*) FILTER (WHERE status_agenda = 'cancelado') AS cancelados,
  COUNT(DISTINCT cliente_id) AS clientes_unicos
FROM public.agendamentos
GROUP BY DATE_TRUNC('month', data_hora_inicio)
ORDER BY mes DESC;

GRANT SELECT ON public.vw_agendamentos_hoje, public.vw_aniversariantes_mes, public.vw_retornos_proximos, public.vw_leads_frios, public.vw_resumo_mensal TO authenticated;

-- REALTIME
ALTER TABLE public.mensagens REPLICA IDENTITY FULL;
ALTER TABLE public.agendamentos REPLICA IDENTITY FULL;
ALTER TABLE public.clientes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;

-- SEEDS
INSERT INTO public.procedimentos (nome, valor_sugerido, duracao_minutos, ativo, comissao_tipo, comissao_valor) VALUES
('Botox', 1200.00, 30, true, 'percentual', 10.00),
('Preenchimento Labial', 1800.00, 45, true, 'percentual', 10.00),
('Limpeza de Pele', 350.00, 60, true, 'percentual', 15.00),
('Microagulhamento', 600.00, 60, true, 'percentual', 12.00),
('Peeling Químico', 450.00, 45, true, 'percentual', 12.00);

INSERT INTO public.funcionarios (nome, role, ativo, status, procedimentos_habilitados) VALUES
('Amanda Silva', 'atendente', true, 'disponivel', '{"Botox","Preenchimento Labial"}'),
('Gabriela Santos', 'tecnica', true, 'disponivel', '{"Limpeza de Pele","Microagulhamento","Peeling Químico"}'),
('Carla Mendes', 'gerente', true, 'disponivel', '{}');