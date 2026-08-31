# Fase 1 — Backend: fundação

Data: 2026-08-31

## O que foi feito

- **Scaffold do NestJS** em `apps/api` via `@nestjs/cli new` (Nest 12). Ajustei o que veio por padrão pra bater com o que a Fase 0 já tinha estabelecido:
  - Removi `oxlint` (linter novo default do CLI) e o `.prettierrc` local — o repo já tem ESLint + Prettier compartilhados na raiz (`pnpm lint` / `pnpm format` cobrem `apps/api` também).
  - `tsconfig.json` agora estende `../../tsconfig.base.json`, só sobrescrevendo o que o Nest precisa (decorators, `target: ES2023`, `strictPropertyInitialization: false`).
  - Removi `@nestjs/mau` (CLI de deploy proprietário da Nest) e o script `deploy` — o plano usa Railway/Fly.io + Vercel (§1 do plano), não o hosting da própria Nest.
  - Removi o `README.md` genérico gerado pelo CLI (só divulgação do framework, nada específico deste projeto).
  - Mantive Vitest (novo default do Nest 12 no lugar de Jest) — não tinha motivo pra trocar.
  - Nome do pacote: `@orcamento/api`, seguindo a convenção do `@orcamento/shared` da Fase 0.

- **Prisma**: schema em `apps/api/prisma/schema.prisma`, exatamente o modelo da §2 do plano (`User`, `Category`, `FixedItem`, `Expense`, enums `TipoLancamento`/`FixedItemRole`/`StatusLancamento`). Primeira migration (`20260831191310_init`) gerada e aplicada contra o Postgres local. Configuração via `prisma.config.ts` (formato novo — o `package.json#prisma.seed` antigo está deprecated a partir da Prisma 6 e some na 7).

- **PrismaModule/PrismaService** — `@Global()`, expõe o `PrismaClient` pro resto da app via DI, conecta/desconecta no ciclo de vida do módulo.

- **UsersModule** — só `UsersService` (findByEmail/findById), sem controller: não há cadastro público (PRD §5), então não existe rota `/users` nenhuma. Serve de base pro `AuthModule` e pro seed.

- **AuthModule** — JWT access+refresh via cookie httpOnly, como o plano pedia:
  - `POST /auth/login` (valida credenciais com bcrypt, seta os dois cookies)
  - `POST /auth/refresh` (guardado por `JwtRefreshGuard`, lê o cookie `refresh_token`, reemite os dois tokens)
  - `POST /auth/logout` (limpa os cookies — sem blacklist/revogação server-side; é uma simplificação aceitável pra um app single-user, ver "Simplificações" abaixo)
  - `GET /auth/me` (guardado por `JwtAccessGuard`)
  - Validação de entrada via `class-validator` (`LoginDto`) + `ValidationPipe` global.
  - Estratégias Passport (`jwt-access`, `jwt-refresh`) leem o token do cookie correspondente; a de access também aceita `Authorization: Bearer` como fallback.

- **Script de seed** (`prisma/seed.ts`, rodado via `pnpm prisma:seed` → `prisma db seed` → `tsx`): cria (upsert, idempotente) o único usuário do app a partir de `SEED_USER_EMAIL`/`SEED_USER_PASSWORD` no `.env`.

- **`.env.example` por app** (mudança em relação à Fase 0): o `.env.example` da raiz agora só tem as vars do Postgres (é o que o `docker-compose.yml` da raiz lê). `DATABASE_URL`, segredos JWT, `API_PORT`, `SEED_USER_*` e `WEB_ORIGIN` foram pra `apps/api/.env.example` — faz mais sentido dado que api e web vão ter deploys separados (§1 do plano).

## Dois problemas de ambiente que encontrei (nada a ver com o código)

Esta máquina já tinha coisas rodando nas portas padrão que eu ia usar. Não mexi em nenhuma delas — só desviei nosso app pra portas livres:

1. **Porta 5432 já em uso por um Postgres nativo do Windows** (processo `postgres.exe` rodando fora do Docker). O Prisma estava tentando autenticar contra esse Postgres nativo (credenciais diferentes das do container), daí o erro `P1000: Authentication failed`. Troquei a porta publicada do container pra **5433** (`POSTGRES_PORT` no `.env.example` da raiz e `DATABASE_URL` no do `apps/api`).
2. **Porta 3000 já em uso por outro processo Node** (`node src/app.js`, rodando desde 26/08 — claramente de outro projeto seu, não relacionado a este). Troquei a porta padrão da API pra **3001** (`API_PORT`) e ajustei `WEB_ORIGIN`/CORS de volta pra `:3000`, assumindo que o Next.js vai ficar com a porta 3000 padrão dele na Fase 5.

Se algum desses dois já está "reservado" pra outra coisa sua, é só ajustar os `.env.example` — não há nada hard-coded além deles.

## Simplificações que assumi (fica registrado)

- **Refresh token sem revogação server-side**: `logout` só limpa os cookies; um refresh token emitido continua criptograficamente válido até expirar (7 dias por padrão) mesmo depois do logout. Pra um app pessoal de usuário único isso é um risco baixo — mas se um dia quiser fechar essa brecha, a solução padrão é guardar um `tokenVersion` (ou o hash do refresh token) no `User` e invalidar trocando esse valor no logout. Não implementei porque o plano não pediu e adicionaria uma tabela/coluna só pra isso.
- **`tsconfck`** (dependência do Vitest/`vite-tsconfig-paths`) reclama de peer dependency querendo `typescript@^5`, e `apps/api` está em `typescript@^6`. É só um aviso — não afeta build nem test — mas registro caso apareça de novo em outra instalação.

## Verificação

- `pnpm build` (dentro de `apps/api`) → compila limpo.
- `pnpm lint` / `pnpm format:check` (raiz, cobrindo o monorepo inteiro) → limpos.
- `pnpm test` (unitário, não depende de banco) → passa.
- `pnpm test:e2e` → **falha sem `.env`/Postgres no ar**, e isso é o esperado (a app falha rápido se `JWT_ACCESS_SECRET` não estiver configurado) — não é um bug, é o app recusando subir sem configuração.
- Testado de ponta a ponta com o servidor real rodando e Postgres via Docker Compose (porta 5433):
  - `POST /auth/login` com senha errada → `401`
  - `POST /auth/login` com credenciais certas → `200` + cookies `access_token`/`refresh_token` (httpOnly)
  - `GET /auth/me` com cookie → `200`; sem cookie → `401`
  - `POST /auth/refresh` → `200`, reemite os cookies
  - `POST /auth/logout` → `200`; `GET /auth/me` depois → `401`
  - `POST /auth/login` com email inválido / sem senha → `400` (validação do DTO)
- Depois dos testes, **parei o servidor, derrubei o container e removi o volume de teste** — nada ficou rodando nem persistido na sua máquina. Os arquivos `.env` locais (copiados dos `.env.example` só pra rodar os testes acima) também foram removidos.

## Ação sua

- **Confirme se as portas 5433 (Postgres) e 3001 (API) fazem sentido pra você**, ou me diga que valores prefere — foram escolhas pra desviar de processos que já ocupavam 5432/3000 nesta máquina, não uma preferência técnica.
- Antes de rodar de verdade: `cp .env.example .env` (raiz) e `cp apps/api/.env.example apps/api/.env`, gerar segredos JWT reais e uma senha de `SEED_USER_PASSWORD` sua.
- Quickstart local (nada disso eu deixei rodando):
  ```
  docker compose up -d
  cd apps/api
  pnpm prisma:migrate
  pnpm prisma:seed
  pnpm start:dev
  ```

## Próxima fase

Fase 2 — Backend: categorias e itens fixos (`CategoriesModule` com CRUD + seed das 12 categorias padrão do PRD §6.3, `FixedItemsModule` com CRUD). Só começo quando você der o sinal.
