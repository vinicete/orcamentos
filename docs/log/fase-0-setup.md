# Fase 0 — Setup do projeto

Data: 2026-08-31

## O que foi feito

- **Monorepo pnpm workspaces**: `pnpm-workspace.yaml` (`apps/*`, `packages/*`) + `package.json` raiz com `packageManager: pnpm@11.9.0` e scripts `lint` / `format` / `format:check`.
- **`packages/shared`** criado como o primeiro workspace real (`@orcamento/shared`), com `tsconfig.json` próprio estendendo o base e um `src/index.ts` vazio — vai receber os enums/DTOs a partir da Fase 1/3. `apps/api` e `apps/web` ainda não existem: entram via `nest new` (Fase 1) e `create-next-app` (Fase 5), para não conflitar com o scaffolding dessas CLIs.
- **TypeScript/ESLint/Prettier compartilhados**:
  - `tsconfig.base.json` na raiz (ES2022, strict, NodeNext) — `apps/web` vai sobrescrever `module`/`moduleResolution`/`jsx` quando o Next for scaffolded, isso é esperado.
  - `eslint.config.mjs` (flat config, ESLint 10) com `typescript-eslint` recomendado + `eslint-config-prettier` pra não conflitar com o Prettier.
  - `.prettierrc.json` / `.prettierignore` (ignora `docs/*.md` e `docs/*.xlsx` — não queremos reformatar os documentos de referência).
  - **Nota**: o pnpm resolveu `typescript@^7.0.2` (a reescrita nova) por padrão, mas o `typescript-eslint@8.68` ainda trava em `<6.1.0`. Fixei em `typescript@5.9.3` (última 5.x estável) — `pnpm peers check` confirma zero conflitos agora. Vale revisitar quando o typescript-eslint suportar TS 7.
- **Docker Compose com Postgres**: `docker-compose.yml` com Postgres 16-alpine, healthcheck via `pg_isready`, porta e credenciais parametrizadas por env var (default `orcamento`/`orcamento`). **Testado de ponta a ponta**: subiu com `docker compose up -d`, ficou `healthy`, `pg_isready` respondeu OK; container e volume de teste foram removidos depois (`docker compose down` + `docker volume rm`) para não deixar nada rodando nem dado de teste no disco.
- **`.env.example`**: `DATABASE_URL`, `POSTGRES_*`, `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (+ expirations), `API_PORT`, `NEXT_PUBLIC_API_URL`. Os segredos JWT estão como placeholder (`replace-with-a-long-random-string`) com o comando pra gerar um valor real no comentário.
- **`.nvmrc`** (`22`) — trava a versão de Node no que já está instalado na máquina.
- Reorganização prévia: os três documentos que estavam na raiz (`PRD`, `PLANO_IMPLEMENTACAO`, a planilha) foram movidos para `docs/` (você já tinha feito isso pela IDE; só consolidei o commit).

## Verificação

- `pnpm lint` → limpo.
- `pnpm format:check` → limpo (depois de rodar `pnpm format` uma vez nos arquivos novos).
- `docker compose config` → válido.
- `docker compose up -d` → container `healthy`, `pg_isready` OK; removido em seguida.

## Ação sua (não bloqueia, mas fica registrado)

- Antes de rodar isso "pra valer" (não só localmente), gere segredos JWT de verdade e um `.env` local a partir do `.env.example` — o `.env` não é versionado (já está no `.gitignore`).
- Se quiser mudar a versão do Postgres, a porta local ou as credenciais de dev, é só editar `.env` — o `docker-compose.yml` já lê tudo de lá com defaults sensatos.

## Próxima fase

Fase 1 — Backend: fundação (scaffold do NestJS dentro de `apps/api`, schema Prisma inicial + primeira migration, `AuthModule`, seed do usuário único). Só começo quando você der o sinal.
