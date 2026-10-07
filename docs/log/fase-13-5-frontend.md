# Fase 13.5 — Frontend

Data: 2026-09-23

Quinta fase do [PLANO_AUTH.md](../PLANO_AUTH.md). O site passa a autenticar pelo Better Auth; o
login antigo (`/auth/login`, JWT) deixa de ser usado pelo front.

## O que foi feito

- **`lib/auth-client.ts`**: `createAuthClient` (`better-auth/react`, mesma versão da API) apontando
  pra `NEXT_PUBLIC_API_URL`, com `credentials: 'include'` (web e API são origens diferentes).
- **Telas** (todas sobre o `AuthShell`, o split de duas colunas extraído do login antigo):
  `/login` (reescrito), `/registrar`, `/verificar-email`, `/esqueci-senha`, `/redefinir-senha`.
  Login com e-mail não confirmado mostra "reenviar e-mail de confirmação". Os links dos e-mails
  levam de volta ao site via `callbackURL`/`redirectTo` (`/login?verificado=1`,
  `/redefinir-senha?token=…`).
- **`lib/auth-errors.ts`**: traduz o `code` do Better Auth pra pt-BR (as mensagens vêm em inglês).
- **`proxy.ts`**: checa o cookie `orcamento.session_token` — e também `__Secure-orcamento.session_token`,
  porque em HTTPS o Better Auth prefixa o cookie e a checagem só pelo nome de dev quebraria em
  produção. Só `/login` e `/registrar` redirecionam quem já tem sessão; verificar/redefinir ficam
  acessíveis.
- **`SignOutButton`** → `authClient.signOut()` (revoga a sessão no servidor).
- **`packages/shared`**: removidos `login`/`logout`/`refresh`/`me` do `ApiClient` e o tipo
  `PublicUser`.

## Verificação

- `pnpm --filter @orcamento/web build`, `pnpm lint`, `prettier --check`: limpos.
- Contra os servidores de dev: proxy redireciona sem sessão pra `/login` e, com cookie, tira de
  `/login`; CORS com credenciais a partir de `localhost:3002`; login → `GET /categories` 200 → sair →
  `401` na mesma sessão.
- **Não testado em navegador**: as telas em si (formulários, mensagens, fluxo de e-mail com os
  links de volta pro site) ainda precisam de um passe manual — cadastro → e-mail → confirmar →
  login → esqueci senha → redefinir → login, no desktop e no celular.

## Pendências pra 13.6

- `WEB_ORIGIN` na API precisa ser a origem real do site em produção: `callbackURL`/`redirectTo`
  são validados contra `trustedOrigins`.

## Próxima fase

13.6 — limpeza (módulo/estratégias/guards JWT antigos, `passwordHash`) e deploy.
