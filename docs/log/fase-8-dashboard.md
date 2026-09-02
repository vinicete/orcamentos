# Fase 8 — Frontend: dashboard

Data: 2026-09-02

A tela de Dashboard sai do placeholder. Diferente de Lançamentos (Fase 7), não tem nada pra escrever — é só leitura de `GET /dashboard/summary`, que a Fase 4 já entrega pronto com todos os números agregados.

## O que foi feito

- **`DashboardView`** (`components/dashboard/`, client component): busca `summary` (pelo mês) e `categories` (pra resolver a cor de cada categoria via `getCategoryColor(order)` — o endpoint de summary só devolve `name`/`total`/`pct`, não o `order`, então precisa dessa segunda busca, igual o `EntryList` já fazia na Fase 7 pra filtro/cor de linha).
- **`KpiStrip`**: os 4 KPIs do design (Gasto do mês, Adicionais, Cartão, Nº de lançamentos) direto dos campos já calculados do summary (`totalSpent`, `additionalSpent`, `cardTotal`, `entryCount`) — zero lógica nova no frontend.
- **`CategoryBars`**: barra horizontal por categoria com nome, valor e `%`, cor da própria categoria. Reaproveita a `MeterBar` da Fase 7 — que ganhou dois parâmetros novos (`color` e `height`) só pra isso, em vez de duplicar o componente: aqui a barra é mais alta (`h-2.5` vs `h-1.5` do rail) e a cor vem do dado da categoria, não do binário "estourou/não estourou" que a `MeterBar` já sabia fazer.
- **`BiggestExpenses`**: lista dos top 7 (`summary.topExpenses`, já ordenado e limitado pela Fase 4), mesmo layout de linha do `EntryRow`/rail (data · descrição · categoria · valor), só que sem edição — é dashboard, não é a lista de lançamentos.
  - Usa `formatDayMonth` (novo em `packages/shared/src/date.ts`, criado na Fase 7 já pensando nisso) pra formatar a data `"2026-08-05"` → `"05/08"`.
- **`FixedItemsTable`**: tabela "orçado x realizado" com cabeçalho, uma linha por item fixo (inclusive as linhas de rollup — teto de adicionais e fatura do cartão aparecem aqui também, porque pra esse comparativo elas são só mais um "orçado x realizado", igual a planilha original mostra). Pendente aparece com `—`/"pendente" nas colunas de realizado e delta, mesma linguagem visual da Fase 7.
  - **Delta colorido**: o campo `delta` que a API devolve é `orçado - realizado` (positivo = economizou). A UI inverte pra mostrar o estouro como a planilha/design mostram — `+R$ x` em `accent-700` só quando `realizado > orçado`; do contrário, mostra a diferença normal em cinza. Confirmado contra dado real: "Energia" (orçado 70, realizado 76) e a própria linha "Gastos Adicionais" (teto 600, realizado 779,47 — o mês estourou o teto) aparecem como estouro; "Pp x Pv" (orçado 200, realizado 146) aparece neutro.

## Verificação

- `pnpm build` (web) → limpo, `/dashboard` continua dinâmica (depende de `searchParams`).
- `pnpm lint` / `pnpm format:check` (raiz) → limpos.
- **Testado contra a API real** (mesmos servidores da Fase 7, já rodando — não mexi neles de novo): busquei o `summary` de agosto/2026 de verdade e conferi cada seção contra os números reais — KPIs, top 3 categorias, top 3 maiores gastos, e as 5 primeiras linhas de fixos com delta (incluindo os dois casos de estouro real que já existem nos seus dados: "Energia" R$ 6 acima do orçado, e o próprio teto de "Gastos Adicionais" R$ 179,47 acima). Também confirmei à parte que `formatDayMonth` interpreta `"2026-08-05"` como UTC e não desloca de dia.
- Não precisei tocar no backend nesta fase — `dashboard.service`/`dashboard.aggregations` (Fase 4) já cobrem tudo que a tela precisa, sem mudança nenhuma.
- **Não testei clicando na UI de verdade** — mesma limitação de sempre (sem automação de navegador). A tela não tem interação (é só leitura), então o risco aqui é menor do que nas fases anteriores — mas vale abrir no navegador pra ver as barras/cores de verdade, principalmente com o teto de adicionais estourado (só existe nesse formato visual desde agora).

## Ação sua

- Dar uma olhada no `/dashboard` — sobretudo a barra de "Gasto por categoria" (cores) e a tabela de fixos (a linha "Gastos Adicionais" deve aparecer com delta vermelho, estourada).

## Próxima fase

Fase 9 — Frontend: tendências (barras empilhadas categoria × mês, clicável pra navegar pro mês, + linha de total mensal em SVG com média tracejada de 8 meses — ambos sem biblioteca de gráfico, só `div`/`svg`, como o design resolve). Só começo quando você der o sinal.
