## Objetivo
Transformar `/atendimento` em uma **Central de Atendimento Humano** com layout 40/60, filtros de status de conversa, controle de "Assumir/Devolver IA" e área de chat com bubbles diferenciados (IA / Cliente / Humano).

## Arquivos alterados

### 1. `src/lib/types.ts`
Adicionar interface:
```ts
export interface Mensagem {
  id: string;
  cliente_id: string;
  remetente: "ia" | "cliente" | "humano";
  texto: string;
  timestamp: string;
}
```
Adicionar tipo de status da conversa (derivado): `"ia_ativa" | "humano_assumiu" | "aguardando_humano"`.

*Nota:* já existe `atendimento_ia: boolean` em `Cliente`. Para representar o estado "aguardando_humano" (IA sugeriu transbordo), adicionar um campo opcional `aguardando_humano?: boolean` no `Cliente` (ou usar campo separado). Vou usar `aguardando_humano?: boolean` para manter compatibilidade.

### 2. `src/routes/atendimento.tsx` (reescrita completa)

**Layout raiz:** `h-screen flex` com colunas 40% / 60% (remove a coluna de prontuário e as tabs WhatsApp/Instagram — a página agora é focada em monitoramento humano, não em anamnese).

**Coluna esquerda (40%) — Lista de Conversas:**
- Header: título "Central de Atendimento" + subtítulo.
- Filtros (tabs/pills): `Todas` | `Aguardando Humano` | `IA Ativa`.
- Lista scrollável de clientes, cada item exibe:
  - Nome
  - Ícone de origem (WhatsApp / Instagram / Presencial) — derivado de campo existente ou mock
  - Temperatura (🔥 quente / 🌡️ morno / 🧊 frio) — do `Cliente.temperatura` se existir, senão mock
  - Badge do setor
  - Indicador de status (bolinha colorida + label):
    - 🟢 "IA ativa" quando `atendimento_ia === true && !aguardando_humano`
    - 🟡 "Aguardando humano" quando `aguardando_humano === true`
    - 🔴 "Humano assumiu" quando `atendimento_ia === false`
  - Preview da última mensagem (truncado)
  - Tempo decorrido (ex.: "há 3 min") — formatado a partir do timestamp da última mensagem

**Coluna direita (60%) — Painel de Conversa:**
- Header do chat:
  - Nome + temperatura + badge do setor
  - Botão **"Assumir Atendimento"** (vermelho) — visível quando IA ativa; ao clicar seta `atendimento_ia = false`.
  - Botão **"Devolver para IA"** (verde) — visível quando IA pausada; ao clicar seta `atendimento_ia = true`.
  - Botão **"Ver no Kanban"** — `<Link to="/kanban">`.
- Área de mensagens (scroll):
  - Bubble IA → esquerda, `bg-muted`, ícone Sparkles
  - Bubble Cliente → esquerda, fundo creme/dourado claro (`bg-champagne-soft/30`), ícone User
  - Bubble Humano → direita, `bg-primary text-primary-foreground`, ícone HeadsetMic/User
  - Cada bubble: texto + timestamp + ícone do remetente
  - Auto-scroll ao final.
- Área de input (rodapé):
  - `Input` + botão `Send`.
  - **Habilitado somente quando** `atendimento_ia === false` (humano assumiu).
  - Quando IA ativa: mostrar aviso `"A IA está conversando. Clique em 'Assumir Atendimento' para intervir."` no lugar do input ativo (input desabilitado + overlay de texto).

### 3. Mock data
- Estado local `mensagens: Record<clienteId, Mensagem[]>` inicializado com conversas realistas (3–4 mensagens por cliente existente no store, misturando remetentes ia/cliente/humano).
- Ao enviar mensagem com humano assumido, adicionar `Mensagem` com `remetente: "humano"` ao array local.
- Marcar 1 cliente do mock como `aguardando_humano: true` para demonstrar o estado amarelo.

### 4. Store (`src/lib/store.ts`)
- Adicionar helper `crmStore.toggleAtendimentoIA(clienteId, ativa: boolean)` (se já não existir método equivalente — caso já haja um `updateCliente`, uso ele diretamente).
- Adicionar campo `aguardando_humano` a alguns clientes mock em `mockData.ts`.

## Fora do escopo (não alterado)
- Painel de anamnese / prontuário / galeria de fotos (removidos desta página; se você quiser preservá-los em outra rota, me avise antes).
- Tabs WhatsApp/Instagram (removidas — a nova página unifica a conversa).
- Nenhuma alteração em Cloud/Supabase; tudo permanece client-side com mock.

## Pontos que preciso confirmar
1. **Remover completamente** o painel de Anamnese + galeria de fotos da página `/atendimento`? (A spec nova não os menciona.) Ou mover para uma nova rota tipo `/prontuario`?
2. **Origem do cliente** (WhatsApp/Instagram/Presencial) — quer que eu adicione um campo `origem` no tipo `Cliente` e nos mocks, ou derivar aleatoriamente?
