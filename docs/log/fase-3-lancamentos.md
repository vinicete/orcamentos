# Fase 3 — Backend: lançamentos

Data: 2026-09-01

## O que foi feito

- **`ExpensesModule`**: CRUD completo em `/expenses`, atrás de `JwtAccessGuard`, escopado por usuário.
  - `GET /expenses?month=&type=&categoryId=&from=&to=&q=` — `month` (formato `YYYY-MM`) filtra por aquele mês inteiro; `from`/`to` são uma alternativa pra intervalo livre quando `month` não é usado; `q` busca por descrição (case-insensitive); ordenado por data decrescente (mais recente primeiro, igual ao protótipo).
  - `POST /expenses`, `PATCH /expenses/:id`, `DELETE /expenses/:id`.
  - `POST /expenses/ensure-month/:yyyyMm` — idempotente.

- **Validação por tipo** (regra do plano), no service (não só no DTO, porque depende de mais de um campo ao mesmo tempo):
  - `FIXO` exige `budget`.
  - `ADICIONAL` não aceita `budget`.
  - `CARTAO` aceita `budget` opcional.
  - `fixedItemId` só é aceito quando `type = FIXO`.
  - Em `PATCH`, a validação roda sobre o registro **já mesclado** (existente + o que veio no patch) — editar só o `amount` de um `FIXO` não deveria conseguir "burlar" a regra de budget obrigatório, por exemplo.
  - `categoryId` e `fixedItemId`, quando informados, são validados como pertencentes ao mesmo usuário (reusando `CategoriesService`/`FixedItemsService` — mesmo padrão da Fase 2).

- **"Pagar pendência"**: no `PATCH`, se o lançamento estava `PENDENTE` e o `amount` foi alterado, o `status` é recalculado automaticamente (`REALIZADO` se `amount > 0`, senão continua `PENDENTE`) — mesma regra do protótipo (`payPending`), sem precisar que o cliente mande o `status` manualmente.

- **`ensure-month`**: pra cada `FixedItem` ativo do usuário que ainda não tem um `Expense` do tipo `FIXO` naquele mês, cria um `PENDENTE` com `amount: 0` e `budget` = o `defaultBudget` do item. Idempotente (rodar duas vezes no mesmo mês não duplica). Um `FixedItem` sem categoria definida é pulado (não dá pra criar o `Expense`, que exige `categoryId`) e volta na resposta em `skipped`, com o motivo — isso não deveria acontecer com os 21 itens que vieram do histórico (todos têm categoria), só é relevante se um item novo for cadastrado sem categoria.

## Verificação

- `pnpm build` / `pnpm lint` / `pnpm format:check` (raiz) → limpos.
- `pnpm test` (unitário) → passa.
- Testado de ponta a ponta **contra o seu banco real** (o que você já tinha rodando, com os 361 lançamentos importados):
  - `GET /expenses?month=2026-08` → 70 lançamentos (bate com a contagem que eu já tinha calculado do dado original).
  - Filtro por `type=CARTAO` e por busca (`q=aluguel`) → resultados corretos.
  - As 5 regras de validação por tipo, uma a uma (`ADICIONAL` com/sem budget, `FIXO` com/sem budget, `fixedItemId` em tipo errado) → `400`/`201` como esperado.
  - `ensure-month/2026-09` → criou os itens fixos que faltavam pra aquele mês; rodado de novo → `created: 0` (idempotente); formato inválido (`2026-9`) → `400`.
  - Paguei uma pendência real (`PATCH` com `amount`) e confirmei o `status` virar `REALIZADO`; editei só a descrição de outra pendência e confirmei que o `status` **não** muda.
  - `DELETE`, `404` em id inexistente, `404` em `categoryId` inválido, `401` sem cookie.
- **Importante**: como os testes rodaram contra o seu banco real (não um banco de teste isolado), **desfiz manualmente tudo que criei/alterei** ao final: apaguei os lançamentos de teste que criei, apaguei os 8 `PENDENTE` que meu teste do `ensure-month` gerou pra setembro, e reverti o pagamento de teste que fiz na "Energia" de volta pra `PENDENTE`/`0`. Conferi antes de mexer que não estava tocando nenhuma linha que já existia do seu seed (usei o `createdAt` pra diferenciar). Servidor parado no final; **deixei o Postgres rodando**, do jeito que você já tinha deixado.

## Ação sua

Nenhuma.

## Próxima fase

Fase 4 — Backend: dashboard (`summary` e `trend`, com testes unitários nas funções de agregação — é a parte com mais lógica de negócio, o plano já marca como "vale cobrir"). Só começo quando você der o sinal.
