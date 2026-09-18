# Fase 13.1 — Better Auth: fundação

Data: 2026-09-18

Primeira fase do [PLANO_AUTH.md](../PLANO_AUTH.md). Better Auth 1.7.5 rodando dentro da API ao lado da
auth JWT antiga — nenhuma mudança visível no app, o front continua usando `/auth/*`.

## O que foi feito

- **Schema**: o `User` atual virou a tabela de usuário do Better Auth (`name`, `emailVerified`,
  `image`, `updatedAt` novos; `passwordHash` virou opcional e sai na 13.6). Tabelas novas `Session`,
  `Account`, `Verification`, conferidas contra o schema interno do pacote instalado, não contra a
  memória. A migration preenche o usuário existente (`name` a partir do e-mail, e-mail marcado como
  verificado — sem isso você ficaria trancado para fora quando a verificação virar obrigatória na
  13.4).
  Os 362 lançamentos continuam ligados ao mesmo `id`, sem migração de dado.
- **Instância** (`auth/better-auth.ts`) registrada como provider `BETTER_AUTH` no `AuthModule`, com o
  `PrismaService` e o `ConfigService` injetados — a guard da 13.2 vai usar o mesmo provider.
- **Handler** montado em `/api/auth/*splat` direto no Express (Express 5 — sintaxe de curinga nova),
  depois do CORS e antes do body parser. O body parser global do Nest foi desligado e religado
  (`json` + `urlencoded`) só depois da rota de auth: era o maior risco de integração do plano.
- **Variáveis novas**: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_COOKIE_DOMAIN` (vazia em dev;
  em produção liga o cookie compartilhado entre subdomínios).
- Login antigo: usuário sem `passwordHash` (criado pelo Better Auth) é recusado em `/auth/login`.
  O seed passou a preencher `name`/`emailVerified`.

## Armadilhas encontradas

- **`generateId: 'uuid'` quebraria os inserts**: no Postgres o adapter deixa de gerar o id e conta
  com default do banco, que as tabelas novas não têm (conferido no código do adapter). Usei uma
  função com `randomUUID()`.
- **`session.cookieCache` atrasava a revogação**: estava no plano como otimização. Testado — com
  ele, uma cópia dos cookies continua autenticada por até 5 minutos depois de sair. Removido;
  sem ele a revogação é imediata (testado de novo). O custo é uma consulta ao banco por requisição.
- **Rate limit por IP atrás de proxy**: só liga em produção (conferido no código e testado numa
  instância temporária com `NODE_ENV=production`: 3 tentativas, depois `429`). Sem `trustedProxies`,
  o `X-Forwarded-For` só é aceito com exatamente um IP; senão todo mundo cai no mesmo balde. Como o
  Railway monta esse cabeçalho só dá pra ver em produção — ficou como verificação da 13.6.
- **Porta 5433 ocupada**: ao ligar o Docker, o `postgres_db` do projeto fest-orders (com
  `restart: always`) subiu antes e tomou a porta. O Postgres do orcamento foi pra **5434**
  (`.env`/`.env.example` da raiz e do `apps/api`, e o `CLAUDE.md`). Container recriado, mesmo volume,
  dados intactos.

## Verificação

- Migration aplicada; `prisma migrate diff` banco × schema vazio.
- Via curl: cadastro, sessão, sair (sessão some do banco), login, senha errada recusada, cookies
  `orcamento.session_token` com `HttpOnly`, CORS certo na rota de auth.
- Auth antiga continua funcionando; POST JSON em rota normal (`/categories`) e o `ValidationPipe`
  continuam OK com o body parser remontado.
- Usuário de teste removido (cascade levou sessões e credencial).
- `pnpm test` (13/13), `pnpm lint`, `pnpm format:check` limpos (fora o aviso antigo do log da fase 5).

## Observação para a 13.5

As mensagens de erro do Better Auth vêm em inglês (`"Invalid email or password"`, com `code`). O
front vai traduzir pelo `code`.

## Próxima fase

13.2 — guard de sessão no lugar do JWT e auditoria de isolamento entre usuários, com testes de
dois usuários.
