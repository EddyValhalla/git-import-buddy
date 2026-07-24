# Conectar GitHub Sync ao projeto

## Objetivo
Vincular este projeto Lovable a um repositório do GitHub para que todas as mudanças sejam sincronizadas automaticamente (push/pull bidirecional).

## Estado atual
O projeto atualmente usa apenas o storage interno do Lovable (`git.private.lovable-gcp.code.storage`). Não há remote apontando para GitHub, portanto o GitHub Sync ainda não está ativo.

## Etapas para ativar

1. **Abrir o menu GitHub no editor Lovable**
   - No canto inferior esquerdo do chat, clique no botão **+** (Plus).
   - Selecione **GitHub** → **Connect project**.

2. **Autorizar o Lovable GitHub App**
   - Será redirecionado ao GitHub para autorizar o app Lovable.
   - Escolha a conta/organização onde o repositório será criado.

3. **Criar o repositório**
   - De volta ao Lovable, selecione a conta/organização autorizada.
   - Clique em **Create Repository** para enviar o código atual do projeto para o GitHub.

4. **Verificar o sync**
   - Após a criação, qualquer alteração no editor Lovable será automaticamente pushada para o branch principal.
   - Alterações feitas diretamente no GitHub também serão sincronizadas de volta ao Lovable.

## Notas importantes
- A sincronização envolve apenas o código. Dados do banco (se houver Lovable Cloud) devem ser exportados separadamente em **Cloud → Advanced settings → Export data**.
- Se você já tem um repositório existente no GitHub, o Lovable não suporta importação direta; o fluxo acima cria um novo repositório. Caso queira usar um repo existente, a alternativa é conectar o sync e depois mover o código manualmente, ou replicar a funcionalidade em novo projeto.
- Somente uma conta GitHub pode estar conectada por vez a uma conta Lovable.

## Pós-ativação
- A validação pode ser feita verificando o remote Git (`git remote -v`) ou acessando a aba GitHub no editor.
- Se o sync não funcionar após conectar, verifique as permissões do Lovable GitHub App na conta/organização selecionada.