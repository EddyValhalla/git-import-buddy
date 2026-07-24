## Objetivo
Adicionar autenticação email/senha ao app, com tabela de perfis, papéis (roles) e proteção de todas as rotas (exceto `/auth`).

## Passos

### 1. Ativar Lovable Cloud
Provisiona o backend (Supabase gerenciado). Sem esse passo, não há como criar tabelas nem autenticar.

### 2. Migration inicial (schema)
- `profiles` (id → auth.users, nome, avatar_url, created_at, updated_at) com RLS: cada usuário lê/edita o próprio perfil.
- Enum `app_role` (`admin`, `atendente`, `user`).
- `user_roles` (user_id, role, unique) com RLS e função `has_role(_user_id, _role)` SECURITY DEFINER para evitar recursão.
- Trigger `on_auth_user_created` → cria linha em `profiles` automaticamente no signup e atribui papel `user` por padrão.
- GRANTs corretos para `authenticated` e `service_role`.

### 3. Estrutura de rotas
Mover todas as rotas atuais (`/agenda`, `/atendimento`, `/kanban`, `/clientes`, etc. e a home `/`) para dentro de `src/routes/_authenticated/`, que é a pathless layout gerenciada pela integração Supabase (redireciona para `/auth` se não autenticado).

- `src/routes/index.tsx` é removido (a home `/` passa a ficar em `src/routes/_authenticated/index.tsx`).
- `src/routes/auth.tsx` público: formulário com abas **Entrar** e **Criar conta** (email + senha), usando o design system existente (paleta dourada/creme do app).

### 4. Cliente Supabase e integração
A integração já cria automaticamente:
- `src/integrations/supabase/client.ts` (browser)
- `src/routes/_authenticated/route.tsx` (gate `ssr:false` → redirect `/auth`)
- Middleware bearer em `src/start.ts`

### 5. UI: header/logout
Adicionar no layout principal (ou onde já existe a navbar) um indicador do usuário logado + botão **Sair** que:
1. `queryClient.cancelQueries()` + `clear()`
2. `supabase.auth.signOut()`
3. `navigate({ to: '/auth', replace: true })`

### 6. Auth state listener
Em `src/routes/__root.tsx`, registrar `onAuthStateChange` filtrado (`SIGNED_IN`/`SIGNED_OUT`/`USER_UPDATED`) que chama `router.invalidate()`.

### 7. Página `/auth`
- Aba "Entrar": `signInWithPassword`
- Aba "Criar conta": `signUp` com `emailRedirectTo: window.location.origin`
- Se já autenticado, redirecionar para `/`
- Mensagens de erro amigáveis em PT-BR

## Observações técnicas
- Papéis ficam em `user_roles` (nunca em `profiles`) por segurança.
- `has_role()` SECURITY DEFINER evita recursão em RLS.
- Confirmação de email fica **desabilitada** por padrão para facilitar testes; pode ser reativada depois nas configs de Auth.
- Nenhuma lógica de negócio (kanban, agenda, atendimento) é alterada — só o wrapper de autenticação.

## O que NÃO faz parte deste plano
- Login social (Google/Apple) — não solicitado
- Reset de senha — pode ser adicionado depois
- Vincular clientes/leads a `user_id` (multi-tenant) — o mockData continua compartilhado por enquanto