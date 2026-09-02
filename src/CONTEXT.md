## CONTEXTO COMPLETO — LUMIÈRE CRM

### BANCO DE DADOS (Supabase)
URL: https://dpfodqctsnzdsqjwrixw.supabase.co
Chave anon: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwZm9kcWN0c256ZHNxandyaXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5ODE3MTYsImV4cCI6MjA5NTU1NzcxNn0.SxGnk9d60CWkURBwWN1PdGbnoFVGPOsQdEEG2rx_IbU

### SCHEMA COMPLETO

Tabela: clientes
- id (UUID, PK)
- nome (TEXT) ← NUNCA usar "nomewpp"
- telefone (TEXT, UNIQUE)
- atendimento_ia (BOOLEAN, DEFAULT true) ← NUNCA comparar com "pause"
- setor (TEXT)
- origem (TEXT)
- temperatura (TEXT)
- aguardando_humano (BOOLEAN, DEFAULT false)
- data_nascimento (DATE)
- consentimento_marketing (BOOLEAN)
- ultima_interacao (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

Tabela: agendamentos
- id (UUID, PK)
- cliente_id (UUID, FK → clientes.id)
- procedimento_id (UUID, FK → procedimentos.id)
- funcionario_id (UUID, FK → funcionarios.id)
- status_kanban (TEXT: novos_clientes, em_atendimento, agendado, concluido, cancelado)
- status_agenda (TEXT)
- data_hora_inicio (TIMESTAMPTZ)
- data_hora_fim (TIMESTAMPTZ)
- data_retorno (DATE)
- tipo_atendimento (TEXT)
- agendado_por_ia (BOOLEAN)
- cliente_nome (TEXT)
- procedimento_nome (TEXT)
- duracao_minutos (INT)

Tabela: procedimentos
- id (UUID, PK)
- nome (TEXT)
- valor_sugerido (NUMERIC)
- duracao_minutos (INT)
- ativo (BOOLEAN)
- status (TEXT)
- comissao_tipo (TEXT)
- comissao_valor (NUMERIC)

Tabela: mensagens
- id (UUID, PK)
- cliente_id (UUID, FK → clientes.id)
- remetente (TEXT: ia, cliente, humano)
- texto (TEXT)
- timestamp (TIMESTAMPTZ)

Tabela: fotos_paciente
- id (UUID, PK)
- cliente_id (UUID, FK)
- url_foto (TEXT)
- tipo (TEXT: antes, depois, evolucao)

Tabela: prontuarios
- id (UUID, PK)
- cliente_id (UUID, FK)
- alergias (TEXT)
- medicamentos (TEXT)
- gestante (BOOLEAN)
- cirurgias (TEXT)
- observacoes (TEXT)

Tabela: funcionarios
- id (UUID, PK)
- auth_user_id (UUID)
- nome (TEXT)
- role (TEXT: admin, atendente)
- ativo (BOOLEAN)
- status (TEXT)
- procedimentos_habilitados (TEXT[])

### ENDPOINTS SUPABASE
- GET: https://dpfodqctsnzdsqjwrixw.supabase.co/rest/v1/{tabela}?select={colunas}&{filtros}
- POST: https://dpfodqctsnzdsqjwrixw.supabase.co/rest/v1/{tabela}
- PATCH: https://dpfodqctsnzdsqjwrixw.supabase.co/rest/v1/{tabela}?{filtro}=eq.{valor}
- Headers: apikey + Authorization: Bearer (ambos com a chave anon)

### REGRAS DE CORREÇÃO
- atendimento_ia é BOOLEAN: comparar com true/false, NUNCA com "pause"/"ativo"
- Coluna de nome é "nome", NUNCA "nomewpp"
- RLS está liberado para anon (INSERT/SELECT/UPDATE em todas as tabelas)
- O workflow está ativo no n8n
- WhatsApp conectado via Evolution API