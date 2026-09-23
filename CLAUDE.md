# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal budget app (pt-BR UI). pnpm monorepo: `apps/api` (NestJS + Prisma + PostgreSQL), `apps/web` (Next.js 16 App Router + Tailwind v4), `packages/shared` (API contract types, typed `ApiClient`, formatting/date helpers). Plans live in `docs/PLANO_IMPLEMENTACAO.md` and `docs/PLANO_AUTH.md`; each implementation phase gets a log in `docs/log/`.

## Rules for this repo

- Never run `git commit`/`git push` — the user reviews and commits everything. When suggesting a commit command, never add a `Co-Authored-By` or any Claude attribution.
- Keep code comments and descriptions to the strict minimum: comment only what's essential, nothing else. No narration, no phase history, nothing the code already says. Rationale goes in `docs/log/`.
- Work one plan phase at a time and wait for the user's go-ahead before starting the next.
- `apps/web/CLAUDE.md` applies inside the web app: Next 16 has breaking changes (e.g. middleware is `proxy.ts`); check `node_modules/next/dist/docs/` before relying on memory.

## Commands

```bash
pnpm install
docker compose up -d                          # local Postgres (apps/api/.env points to port 5434)
pnpm --filter @orcamento/api prisma:migrate   # prisma migrate dev
pnpm --filter @orcamento/api prisma:seed      # user + default categories + historical data
pnpm --filter @orcamento/api start:dev        # API on :3001
pnpm --filter @orcamento/web dev              # web on :3002

pnpm lint                                     # eslint, whole monorepo (run from root)
pnpm format:check                             # prettier, whole monorepo
pnpm --filter @orcamento/api build
pnpm --filter @orcamento/web build

pnpm --filter @orcamento/api test                                                   # vitest
pnpm --filter @orcamento/api test:e2e                                               # needs the local Postgres up; no real e-mail is sent
pnpm --filter @orcamento/api exec vitest run src/dashboard/dashboard.aggregations.spec.ts
pnpm --filter @orcamento/api exec vitest run -t "nome do teste"
```

`docs/log/fase-5-frontend-fundacao.md` has a pre-existing prettier warning; ignore it when reading `format:check` output.

## Architecture

### Domain model (`apps/api/prisma/schema.prisma`)

- `Expense.type`: `FIXO` (requires `budget`), `ADICIONAL` (forbids `budget`), `CARTAO` (optional `budget`). `fixedItemId` only valid for `FIXO`. Enforced in `ExpensesService.assertTypeRules`.
- `FixedItem` is the catalog of recurring monthly items. `POST /expenses/ensure-month/:yyyyMm` idempotently creates a `PENDENTE` expense (amount 0) per active item; PATCHing a pending expense's amount > 0 flips it to `REALIZADO`.
- `FixedItem.role`: `ADDITIONAL_CEILING` (monthly cap for ADICIONAL spending) and `CARD_INVOICE` (last month's card bill) are rollup rows. Dashboard math depends on role, never on the item's name.
- All data is scoped by `userId` from `SessionGuard` (Better Auth session, exposed as `@CurrentUser()`); every service query must filter by it. `test/multi-user-isolation.e2e-spec.ts` proves it with two users.

### Dashboard math (`apps/api/src/dashboard/dashboard.aggregations.ts`)

Pure functions, unit-tested without a DB; `dashboard.service.ts` only fetches. Two intentionally different totals:

- `totalSpent` = FIXO (excluding the ceiling row) + ADICIONAL. CARTAO is excluded (it is paid via next month's invoice row).
- Per-category totals and `trend` use accrual basis: everything including CARTAO, excluding both rollup roles (otherwise double counting).

### API conventions

- ESM with NodeNext resolution: relative imports in `apps/api` need the `.js` suffix.
- Prisma `Decimal` fields (`amount`, `budget`, `defaultBudget`) serialize as **strings** in JSON; dashboard endpoints return real numbers. `packages/shared/src/types.ts` mirrors this.
- Delete conflicts (FK in use) surface as `409` with a user-facing pt-BR message the frontend displays as-is.

### Web conventions

- `packages/shared` is consumed as raw TS via `transpilePackages` (bundler resolution): no `.js` suffixes there.
- Selected month lives in the URL (`?mes=YYYY-MM`) and is shared across views. `proxy.ts` gates protected routes by auth cookie presence and adds a missing `?mes=`.
- Data fetching is client-side through the `api` singleton (`lib/api-client.ts`, `credentials: 'include'`), usually with an `ignore` flag in `useEffect` cleanup. The `react-hooks/set-state-in-effect` lint rule is enforced: set state only in async callbacks, or adjust state during render.
- Design tokens are CSS-first in `app/globals.css` (`@theme`); radius is 0 everywhere. No inline styles except runtime-computed values (bar widths/heights, category colors). Category color comes from `Category.order` via `getCategoryColor`.
- shadcn/ui is used only for primitives (`Sheet`, `Dialog`); `components/ui/button.tsx` is our own component, don't let `shadcn add` overwrite it. The shadcn `Sheet` applies `gap-4` between children; override with `gap-0` when spacing matters.
- Confirmations/alerts go through `useConfirmDialog()` (`lib/confirm-context.tsx`), not `window.confirm`.
- Inputs use ≥16px font on mobile (global rule in `globals.css`) to avoid browser zoom-on-focus.

### Deploy

- API: Railway, built from `apps/api/Dockerfile` with the repo root as build context; the container runs `prisma migrate deploy` before starting. Railway's "Custom Start Command" must stay empty so the Dockerfile `CMD` is used.
- Web: Vercel, root directory `apps/web`. `NEXT_PUBLIC_API_URL` is inlined at build time, so changing it requires a redeploy.
- Domains: web `orcamento.jeenyuhs.com.br`, API `api.orcamento.jeenyuhs.com.br`. Auth is Better Auth (`apps/api/src/auth`, mounted at `/api/auth`); its session cookie (`orcamento.session_token`, `__Secure-` prefixed on HTTPS) is set on `.orcamento.jeenyuhs.com.br` in production via `AUTH_COOKIE_DOMAIN` so both subdomains see it. API env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_COOKIE_DOMAIN`, `WEB_ORIGIN` (must match the site exactly: it validates e-mail callback URLs), `RESEND_API_KEY`, `EMAIL_FROM`.
