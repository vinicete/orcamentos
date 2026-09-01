# Fase 4 — Backend: dashboard

Data: 2026-09-01

## O que foi feito

- **`DashboardModule`**: `GET /dashboard/summary?month=YYYY-MM` e `GET /dashboard/trend?months=` (default 12), atrás de `JwtAccessGuard`.
- **Lógica de agregação extraída em funções puras** (`dashboard.aggregations.ts`), separadas do `DashboardService` (que só busca no Prisma e converte pro formato de entrada): é o que o plano pedia — "vale cobrir com testes" — e funções puras (sem depender de banco) são o jeito de fazer isso sem precisar de banco de teste.
- **13 testes unitários** (`dashboard.aggregations.spec.ts`), sobre `computeSummary`, `computeTrend` e `lastNMonths` (esse último já morava em `common/month-range.ts`, extraído do `ExpensesService` — usado agora também pelo dashboard, então virou helper compartilhado em vez de duplicado).

## As fórmulas do §0.3, agora via `FixedItemRole` em vez de regex

O §0.3 do plano descreve `isCeiling`/`isRollup` como regex sobre a descrição (é como o protótipo do Claude Design faz). Como a Fase 1 já tinha resolvido isso criando o enum `FixedItemRole` (`ADDITIONAL_CEILING`/`CARD_INVOICE`/`NORMAL`) exatamente pra não depender de regex, a implementação usa o `role` do `FixedItem` vinculado — que já está corretamente atribuído nos 21 itens fixos importados na Fase 2b.

Duas fórmulas que valem destacar porque não são óbvias e **são intencionalmente diferentes uma da outra**:

- **`totalSpent`** (o "gasto do mês" do KPI/rail) = soma(FIXO exceto o teto de Adicionais) + soma(ADICIONAL). **Não inclui `CARTAO`** — compras no cartão só entram no "gasto" quando viram a linha `CARD_INVOICE` ("Fatura mês passado") no mês seguinte.
- **`categories`/`trend.total`** (quebra por categoria e evolução mensal) = soma de tudo **exceto** as duas linhas de rollup (teto e fatura) — aqui `CARTAO` **entra**, no mês em que a compra aconteceu (regime de competência), porque senão a compra em si nunca apareceria em nenhuma categoria.

Ou seja: pro mesmo mês, `summary.totalSpent` e `summary.categories` somados não batem entre si — não é bug, são dois recortes diferentes do mesmo dado, exatamente como o plano especifica. Documentei isso como comentário na própria função, porque na hora de conectar o frontend (Fase 8) alguém vai estranhar esse número não fechar e vale ter a explicação ali.

## Verificação

- `pnpm test` → **13/13 passando**, cobrindo: teto excluído do gasto mas incluído no orçado; fatura do cartão incluída no gasto (ao contrário do teto); adicionais vs. teto; rollups fora da quebra por categoria e do top; top limitado a 7 e ordenado; `delta` nulo em pendente; mês vazio sem quebrar; `computeTrend` agregando por mês/categoria; mês sem lançamento não sai da série (fica com total 0); `lastNMonths` cruzando virada de ano.
- `pnpm build` / `pnpm lint` / `pnpm format:check` (raiz) → limpos.
- Testado via HTTP contra o seu banco real (só leitura, nada foi criado/alterado):
  - `GET /dashboard/summary?month=2026-08` → **conferi os 5 números principais contra uma query SQL independente** (feita direto no Postgres, sem passar pelo código) — bateram exatamente: `totalSpent 3316,58`, `totalBudget 3525,11`, `additionalSpent 779,47`, `cardTotal 1371,05`, `4` pendentes, `70` lançamentos.
  - `GET /dashboard/trend?months=8` → cobre exatamente Fev–Set/2026 (a partir do mês atual real do servidor, não mais os 8 meses fixos do protótipo), com o total de agosto propositalmente diferente do `totalSpent` do summary (explicado acima).
  - Validação: `month` em formato errado ou ausente → `400`; `months` fora de 1–36 → `400`; sem cookie → `401`.

## Ação sua

Nenhuma.

## Próxima fase

Fase 5 — Frontend: fundação e design system (scaffold do Next.js + Tailwind com os tokens do design portados, cliente HTTP tipado, shell com nav + seletor de mês). É a primeira fase de frontend — a partir daqui dá pra ver telas de verdade. Só começo quando você der o sinal.
