# Fase 2b — Seed do histórico

Data: 2026-09-01

Você começou essa fase configurando o ambiente sozinho (`.env`, `docker compose up`, migration, seed de categorias/usuário) — eu continuei a partir daí com o import dos 361 lançamentos reais.

## O que foi feito

- **Dado de origem**: extraí o array `expenses` do `budget-data.js` do projeto no Claude Design (já tinha lido esse arquivo no início da sessão, pra montar o plano) pra `apps/api/prisma/seed-data/budget-data.json` — 361 lançamentos, Fev–Set/2026, no formato original do protótipo (inglês, `type: fixed|additional|card`, `status: done|pending`).

- **`prisma/seed.ts` estendido** (mesmo comando `pnpm prisma:seed`, como o plano descreve — não criei um script separado):
  - Mapeia `type`/`status` do formato do protótipo pros enums do schema (`FIXO`/`ADICIONAL`/`CARTAO`, `REALIZADO`/`PENDENTE`).
  - Mapeia as 12 categorias do protótipo (inglês) pras 12 já seedadas em pt-BR (`Housing→Moradia`, etc. — mesma tabela que tinha ficado registrada no plano quando decidimos o idioma).
  - Cria um `FixedItem` por nome distinto de lançamento `fixed` (21 no total) **antes** dos lançamentos, já que `Expense.fixedItemId` depende deles existirem.
  - `role` do `FixedItem` classificado pela mesma regra do §0.3 do plano (regex em cima do nome: "Gastos Adicionais"/"Gastos Imprevisíveis" → `ADDITIONAL_CEILING`, "Fatura mês passado" → `CARD_INVOICE`, resto → `NORMAL`).
  - `defaultBudget` do `FixedItem` = o orçamento mais recente daquele nome no histórico (o valor **varia** mês a mês nos dados reais — Aluguel foi de 680→710, Facul de 1000→544, o teto de Adicionais de 250→600 — então "mais recente" é a leitura mais útil de "quanto custa hoje"; cada `Expense` mantém seu próprio `budget` daquele mês específico, que é o que já é usado pra comparação orçado×realizado).
  - Reimportação idempotente: a cada execução, apaga os lançamentos existentes do usuário no intervalo Fev–Out/2026 e reinsere os 361 do zero (mesmo espírito do botão "Reset to sheet data" do protótipo) — rodar `pnpm prisma:seed` de novo não duplica nada.

## Verificação

- `pnpm build` / `pnpm lint` / `pnpm format:check` → limpos.
- Rodei o seed duas vezes seguidas no banco que você já tinha subido: primeira vez importou 361, segunda vez removeu 361 antigos e reimportou 361 — confirma a idempotência.
- Conferi direto no Postgres:
  - Contagem por tipo bate com a análise que eu tinha feito do dado original: 109 `FIXO`, 165 `ADICIONAL`, 87 `CARTAO`.
  - `0` lançamentos `FIXO` sem `fixedItemId` e `0` lançamentos não-`FIXO` com `fixedItemId` (nenhuma referência cruzada errada).
  - Os 21 `FixedItem`s com `role`/`categoria`/`defaultBudget` corretos (ex.: "Fatura mês passado" → `CARD_INVOICE`, categoria "Dívidas/Fatura"; "Gastos Adicionais" → `ADDITIONAL_CEILING`, orçamento mais recente 600).
- Testado também via API real (login com seu usuário + `GET /fixed-items`) — os 21 itens aparecem certinho.
- **Não derrubei o Postgres nem o servidor no final** — deixei do jeito que você tinha deixado, já que é o seu ambiente de trabalho nessa fase, não uma verificação minha isolada. Só parei o processo do `pnpm start` que eu subi pra testar.

## Ação sua

Nenhuma. O banco que você já tem rodando está com os dados históricos importados.

## Próxima fase

Fase 3 — Backend: lançamentos (`ExpensesModule`: CRUD com validação por tipo, e o endpoint `ensure-month` pra gerar as pendências de fixos no início do mês). Só começo quando você der o sinal.
