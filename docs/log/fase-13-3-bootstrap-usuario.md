# Fase 13.3 — Bootstrap de usuário novo

Data: 2026-09-18

Terceira fase do [PLANO_AUTH.md](../PLANO_AUTH.md). Cadastro via Better Auth agora deixa a conta
pronta pra uso: categorias padrão + os dois itens fixos de rollup, sem passo manual.

## O que foi feito

- **`categories/default-categories.ts`**: `DEFAULT_CATEGORIES` saiu do `prisma/seed.ts` pra cá —
  fonte única entre o seed (usuário de teste + histórico) e o bootstrap de cadastro.
- **`auth/bootstrap-new-user.ts`**: roda dentro de `databaseHooks.user.create.after`
  (`better-auth.ts`) — cria as 12 categorias e, na mesma transação, os dois itens fixos de rollup:
  "Gastos Adicionais" (`ADDITIONAL_CEILING`) na categoria Outros, "Fatura mês passado`
  (`CARD_INVOICE`) na categoria Dívidas/Fatura — mesmos nomes e categorias que o histórico seedado
  usa (`roleFor`/`CATEGORY_PT` em `seed.ts`), `defaultBudget: 0` (o usuário ajusta depois). Sem o
  item de teto, `computeSummary` devolveria `additionalCeiling: 0` pra sempre, e a barra de
  adicionais do rail nasceria quebrada — por isso os dois entram junto, não só as categorias.
- **`test/bootstrap-new-user.e2e-spec.ts`**: cadastro novo → 12 categorias certas, os 2 itens de
  rollup com `categoryId` preenchido, `ensure-month` cria as 2 pendências, `dashboard/summary` e
  `dashboard/trend` respondem sem erro com conta vazia.
- Ajuste no `multi-user-isolation.e2e-spec.ts`: o teste de `ensure-month` assumia que um usuário
  novo não tinha nenhum item fixo (`created: 0`); com o bootstrap, todo usuário novo já nasce com os
  2 itens de rollup — o teste passou a comparar contra a lista de itens fixos do próprio usuário B,
  em vez de um número fixo.

## Verificação

- `pnpm --filter @orcamento/api test:e2e`: 16/16 (13 anteriores + 3 novos de bootstrap).
- `pnpm --filter @orcamento/api test`, `pnpm lint`, `pnpm format:check`, `pnpm --filter @orcamento/api build`: limpos (fora o aviso antigo do log da fase 5).
- Import cruzado `prisma/seed.ts` → `src/categories/default-categories.ts` resolvido via `tsx`
  (mesma convenção NodeNext do resto do projeto) — confirmado à parte, sem rodar o seed real pra não
  mexer nos dados de desenvolvimento.

## Próxima fase

13.4 — e-mail (Resend + DNS): verificação obrigatória e reset de senha por e-mail.
