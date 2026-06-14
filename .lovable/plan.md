## Plano: Trazer o código de `EddyValhalla/Antigravity-` para este projeto Lovable

Como o Lovable não importa repositórios existentes diretamente, vamos copiar o código do repo para este projeto atual (que já é TanStack Start, mesma stack do repo — compatível).

### Passos

1. **Clonar o repo no sandbox** via `git clone https://github.com/EddyValhalla/Antigravity-.git /tmp/antigravity`.
2. **Inspecionar a estrutura** do repo (`package.json`, `src/`, `src/routes/`, configs) para entender o que existe.
3. **Mesclar arquivos no projeto atual**:
   - Copiar `src/` (componentes, rotas, hooks, estilos) sobrescrevendo os atuais.
   - Mesclar `package.json` (dependências do repo) e rodar `bun install`.
   - Copiar configs relevantes (`vite.config.ts`, `tsconfig.json`, `tailwind`/`styles.css`) **somente se compatíveis** com o template Lovable — preservando o bootstrap do TanStack Start (`src/router.tsx`, `src/routes/__root.tsx`, `src/start.ts`).
   - **NÃO** copiar: `.git`, `node_modules`, `routeTree.gen.ts` (auto-gerado), arquivos `.lovable` do outro projeto, CI/CD.
4. **Reconectar integrações manualmente** depois (Cloud, secrets, Stripe, etc. — o repo não traz isso).
5. **Validar build** e ajustar conflitos (rotas duplicadas, imports quebrados, deps faltando).

### Pontos de atenção

- Se o repo usar Supabase/env vars próprias, você precisará habilitar Lovable Cloud aqui e recriar as tabelas/secrets.
- Se houver conflito entre `src/routes/index.tsx` do template e do repo, mantemos o do repo.
- Qualquer dependência Node-only (que não roda em Cloudflare Workers) precisará ser substituída.

### Próximo passo

Confirme e eu executo o clone + cópia no modo build. Quer que eu **sobrescreva completamente** o `src/` atual com o do repo, ou prefere uma **mesclagem seletiva** (revisando arquivo por arquivo)?