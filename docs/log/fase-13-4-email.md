# Fase 13.4 — E-mail (Resend)

Data: 2026-09-18

Quarta fase do [PLANO_AUTH.md](../PLANO_AUTH.md). Verificação de e-mail e reset de senha ligados ao
Better Auth via Resend. `requireEmailVerification` fica **desligado** por decisão explícita: liga só
depois que a conta no Resend e o DNS (SPF/DKIM no registro.br) estiverem confirmados de ponta a
ponta — até lá, ligar quebraria o login local (cadastro para de autenticar na hora até o e-mail ser
confirmado). Isso é passo do usuário, fora do que dá pra automatizar aqui.

## O que foi feito

- **`auth/email.ts`**: `createEmailSender(config)` usa o SDK do Resend quando `RESEND_API_KEY` está
  configurado; sem a chave, loga o corpo do e-mail (link incluso) no console em vez de falhar —
  dá pra testar o fluxo local sem conta no Resend, e falha de envio não derruba cadastro/reset (só
  loga o erro).
- **`better-auth.ts`**: `emailAndPassword.sendResetPassword` + `revokeSessionsOnPasswordReset: true`;
  `emailVerification.sendOnSignUp: true` + `sendVerificationEmail`. `requireEmailVerification` não
  entrou (ver acima).
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

## Pendente (fora do que dá pra automatizar)

1. Criar conta no Resend, verificar o domínio `orcamento.jeenyuhs.com.br`.
2. Adicionar os registros SPF/DKIM no registro.br (mesmo lugar dos CNAMEs do deploy — atraso de
   propagação esperado).
3. Preencher `RESEND_API_KEY` no `.env` (local) e no Railway (produção, fase 13.6).
4. Só depois disso testado de ponta a ponta (e-mail chegando numa caixa real): ligar
   `requireEmailVerification: true`.

## Verificação

- `pnpm --filter @orcamento/api test:e2e`: 18/18 (16 anteriores + 2 novos de e-mail).
- `pnpm --filter @orcamento/api test`, `pnpm lint`, `pnpm format:check`, `pnpm --filter @orcamento/api build`: limpos (fora o aviso antigo do log da fase 5).

## Próxima fase

13.5 — frontend: `authClient`, telas de cadastro/login/esqueci-senha/verificar-email,
`proxy.ts` no cookie novo. Depende do `requireEmailVerification` só entrar quando o passo pendente
acima estiver resolvido — as telas de verificação/reset não têm como ser testadas de verdade sem
e-mail funcionando (mesma ordem do §5 do plano).
