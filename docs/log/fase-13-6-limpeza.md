# Fase 13.6 — Limpeza e deploy

Data: 2026-09-23

Sexta fase do [PLANO_AUTH.md](../PLANO_AUTH.md). Remove a auth JWT antiga e fecha o deploy.

## O que foi feito

- **Removido**: `AuthController`/`AuthService` antigos, guards e estratégias Passport, `LoginDto`,
  `duration.ts`, `UsersModule`/`UsersService`, e as dependências `@nestjs/jwt`, `@nestjs/passport`,
  `passport`, `passport-jwt`, `bcrypt` e os `@types` correspondentes. `AuthModule` só provê
  `BETTER_AUTH` e `SessionGuard`.
- `JwtPayload` virou `AuthUser` (`auth/auth-user.ts`): o nome já não fazia sentido.
- **Migration** `drop_password_hash`: escrita à mão (o `migrate dev` recusa rodar sem terminal
  interativo quando a coluna tem dado). Schema e banco conferidos: sem diferença.
- **Seed**: cria o usuário e a credencial no Better Auth (`hashPassword` de `better-auth/crypto`) em
  vez do `passwordHash` bcrypt. Rodar o seed sobrescreve a senha do usuário com `SEED_USER_PASSWORD`.
- `JWT_*` saíram dos `.env.example`.
- `CLAUDE.md` atualizado (guard de sessão, cookie do Better Auth, variáveis de ambiente da API).

## Deploy: erro `bun:sqlite`

O build no Railway falhou com `Cannot find module 'bun:sqlite'`. Os tipos do `better-auth` importam
esse módulo e ele nunca resolve, nem localmente; localmente o `skipLibCheck: true` do
`tsconfig.base.json` esconde o erro. O Dockerfile não copiava o `tsconfig.base.json`, então o
`extends` do `apps/api/tsconfig.json` se perdia e o build de produção rodava sem `skipLibCheck` (e
sem `strict`). Correção: `COPY … tsconfig.base.json ./` no Dockerfile. Reproduzido e validado
construindo a imagem localmente.

## Verificação

- `test:e2e` 18/18, `test` 13/13, `lint`, `build`; imagem Docker da API constrói.

## Pendente em produção (manual)

- Conferir o rate limit atrás do proxy do Railway: sem `trustedProxies`, o `X-Forwarded-For` só é
  aceito com exatamente um IP; procurar nos logs o aviso "falling back to a single shared per-path
  bucket" e ajustar `advanced.ipAddress` se aparecer (risco 9 do plano).
- Teste de ponta a ponta criando uma segunda conta real em produção.
- Redefinir a senha da conta existente pelo "Esqueci minha senha" (a senha antiga não migra).
- Apagar `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (e `_EXPIRES_IN`) do Railway; o código não lê mais.
- Trocar a `RESEND_API_KEY` de produção por uma chave nova (a de dev foi colada em conversa).

## Próxima fase

13.7 (opcional) — login com Google.
