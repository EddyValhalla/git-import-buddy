## Decisão

Manter o fluxo de autenticação existente: **o primeiro cadastro em `/auth` torna-se administrador automaticamente**. Nenhuma alteração de código ou migration é necessária.

## Fluxo recomendado ao usuário

1. Acessar `/auth`.
2. Clicar em **Criar conta**.
3. Informar nome, e-mail e senha (mínimo 6 caracteres).
4. O trigger `on_auth_user_created` cria o perfil, atribui a role `admin` e direciona para `/`.
5. A partir daí, o admin pode criar outros usuários/atendentes via interface de configurações quando existir.

## Observações de segurança

- Não há credencial pré-definida de fábrica.
- Qualquer pessoa que acessar a rota `/auth` antes do primeiro cadastro pode se tornar admin. Isso é aceitável enquanto o app estiver em ambiente interno/preview; em produção pública, recomenda-se criar um seed de admin padrão ou desabilitar auto-cadastro após o primeiro usuário.
- Nenhuma migration, schema, RLS ou componente precisa ser modificado.

## O que não será feito

- Criar usuário admin padrão via seed.
- Alterar o `on_auth_user_created` trigger.
- Modificar a página `/auth` ou o `AuthContext`.
