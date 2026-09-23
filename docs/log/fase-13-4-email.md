# Fase 13.4 — E-mail (Resend)

Data: 2026-09-18

Quarta fase do [PLANO_AUTH.md](../PLANO_AUTH.md). Verificação de e-mail e reset de senha ligados ao
Better Auth via Resend. Ficou em duas partes: `requireEmailVerification` entrou **desligado** em
2026-09-18 (dependia do usuário criar a conta no Resend e confirmar o DNS) e foi **ligado** em
2026-09-22, depois que o domínio apareceu como `verified` na API do Resend e um e-mail de teste
real chegou na caixa de entrada.

## O que foi feito

- **`auth/email.ts`**: `createEmailSender(config)` usa o SDK do Resend quando `RESEND_API_KEY` está
  configurado; sem a chave, loga o corpo do e-mail (link incluso) no console em vez de falhar —
  dá pra testar o fluxo local sem conta no Resend, e falha de envio não derruba cadastro/reset (só
  loga o erro).
- **`better-auth.ts`**: `emailAndPassword.sendResetPassword` + `revokeSessionsOnPasswordReset: true`;
  `emailVerification.sendOnSignUp: true` + `sendVerificationEmail`; `requireEmailVerification: true`
  (ligado em 2026-09-22, ver "Fechamento" abaixo).
- **`test/email-flows.e2e-spec.ts`**: como não há conta Resend ainda, o teste captura o link
  logado no console (mesmo caminho que um dev sem `RESEND_API_KEY` usa) e:
  - cadastro → link de verificação → `GET /api/auth/verify-email` confirma a conta (`emailVerified: true`);
  - `POST /api/auth/request-password-reset` → link de reset → `POST /api/auth/reset-password` troca
    a senha, revoga a sessão do cadastro (`401` na sessão antiga) e o mesmo token não serve numa
    segunda tentativa (`400`); login com a senha nova funciona.

## Armadilha encontrada

- `GET /api/auth/verify-email` devolve **redirect (302)** pro `callbackURL`, não `200` com JSON — o
  Better Auth sempre inclui um `callbackURL` (default `/`) na URL do e-mail, e com ele presente o
  sucesso vira redirect. Só cai em JSON quando não há `callbackURL` na query.

## Fechamento (2026-09-22)

- Usuário criou a conta no Resend, verificou o domínio e adicionou os registros SPF/DKIM no
  registro.br — confirmado direto na API do Resend (`GET /domains` → `status: "verified"`), sem
  esperar propagação.
- `RESEND_API_KEY` preenchido no `apps/api/.env` (só local — Railway fica pra 13.6). E-mail de teste
  disparado direto pela API do Resend pro usuário, chegou na caixa real.
- `requireEmailVerification: true` ligado em `better-auth.ts`. Isso muda o cadastro: com a
  verificação exigida, `POST /api/auth/sign-up/email` **não loga mais sozinho** (`token: null`,
  sem cookie de sessão) — o fluxo real vira cadastro → confirmar e-mail → login.
- Os 3 specs e2e que assumiam sessão automática no cadastro (`multi-user-isolation`,
  `bootstrap-new-user`, `email-flows`) foram ajustados pra passar pelo fluxo de verdade. Extraí o
  helper `test/support/auth-flow.ts` (`signUpVerifiedUser`) — cadastra, captura o link de
  verificação do log (`console.warn`, já que testes não devem bater no Resend de verdade), confirma
  a conta e faz login — usado pelos dois primeiros; `email-flows` mantém os passos explícitos
  (é o que está testando) mas agora também loga in antes do teste de reset de senha, senão a
  asserção de "sessão revogada" seria verdadeira mesmo sem revogação nenhuma (nunca teria sessão).
- **`vitest.config.e2e.ts`**: `env: { RESEND_API_KEY: '' }` força o fallback de log em teste,
  mesmo com a chave real no `.env` — sem isso, todo teste que cadastra usuário dispararia e-mail de
  verdade pro Resend (pra domínios fake tipo `@teste.local`) e o helper de captura pararia de achar
  o link no console.

## Verificação

- `pnpm --filter @orcamento/api test:e2e`: 18/18, agora com `requireEmailVerification: true` de
  verdade (cadastro → verificação → login em cada teste que precisa de sessão).
- `pnpm --filter @orcamento/api test`, `pnpm lint`, `pnpm format:check`, `pnpm --filter @orcamento/api build`: limpos.
- Domínio `verified` na API do Resend; e-mail de teste entregue numa caixa real.

## Próxima fase

13.5 — frontend: `authClient`, telas de cadastro/login/esqueci-senha/verificar-email,
`proxy.ts` no cookie novo.
