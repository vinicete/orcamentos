# Fase 10 — Frontend: recorrentes e categorias

Data: 2026-09-02

Últimas duas telas do MVP. Diferente das fases anteriores, essas não vêm do design (§0.4 #1 do plano — `CATS` é constante e os fixos vêm dos dados no protótipo) — segui o PRD §6.3/§7.3 direto: adicionar/renomear/remover categoria, e cadastrar/editar/desativar item fixo, no mesmo padrão visual de lista (edição inline) das fases anteriores.

## O que foi feito

### Categorias (`components/categorias/`)

- **`NewCategoryForm`**: um campo + botão, cria via `POST /categories` (a API já calcula o próximo `order` sozinha desde a Fase 2 — não precisei reimplementar isso no frontend).
- **`CategoryRow`**: mesmo padrão do `EntryRow`/`EntryFilters` das fases anteriores — clique na linha renomeia inline, Enter salva, Escape cancela, `×` exclui com `window.confirm`.
- Sem reordenação nesta fase — o PRD só pede adicionar/renomear/remover; `order` (usado pra cor da categoria no dashboard/tendências) continua definido só na criação.

### Recorrentes (`components/recorrentes/`)

- **`NewFixedItemForm`**: nome, orçado, categoria (select). Não expõe o campo `role` na criação — todo item novo nasce `NORMAL` (default do Prisma), que é o caso comum; os dois papéis especiais (teto de adicionais, fatura do cartão) já existem via seed e só fazem sentido editados, não criados do zero.
- **`FixedItemRow`**: mesmo padrão de edição inline, com um campo a mais que o `EntryRow` — o `role` (select com os três valores). Toggle de **ativo/inativo** como botão próprio na visualização (não abre edição) — `active: false` é o mecanismo que já existe desde a Fase 3 pra parar de gerar pendência mensal via `ensure-month`, sem apagar o item nem seu histórico.
- **Aviso de papel duplicado**: como `computeSummary` (Fase 4) pega só o *primeiro* item com `role: ADDITIONAL_CEILING`/`CARD_INVOICE` que encontrar (`fixed.find(isCeiling)`), e a API não impede cadastrar um segundo com o mesmo papel, a UI mostra um aviso (não bloqueia) se o usuário tentar colocar um item num papel que outro item ativo já tem — pra não criar um segundo teto/fatura "invisível" pro dashboard sem perceber.
- **Exclusão com erro esperado**: tanto `FixedItem` quanto `Category` têm `onDelete: Restrict` (Fase 2)/checagem de FK (Fase 2) — excluir algo em uso por lançamentos falha com `409` e mensagem pronta da API ("Item fixo tem lançamentos associados — desative-o..." / "Categoria em uso por lançamentos ou itens fixos..."). A UI só precisa repassar `err.message` num `window.alert` — não teve que reimplementar nenhuma regra de negócio pro caso de erro, a API já entrega o texto certo.

### Padrão de diálogo nativo (mesma decisão da Fase 7)

Usei `window.confirm`/`window.alert` pros mesmos casos (excluir, e agora também erro de exclusão bloqueada) — consistente com a decisão já tomada na Fase 7 de adiar a troca por um Dialog customizado pra Fase 11 (Polish), em vez de misturar padrões diferentes nesta fase.

## Verificação

- `pnpm build` (web) → limpo; `/categorias` e `/recorrentes` viraram rotas **estáticas** (não dependem mais de `?mes=`, diferente das outras telas do app).
- `pnpm lint` / `pnpm format:check` (raiz) → limpos.
- **Testado contra a API real**: criei, renomeei e tentei duplicar uma categoria de teste (confirmei o `409` com a mensagem exata que a UI mostra); criei, editei (nome/orçado/role) e desativei um item fixo de teste, depois apaguei (sem lançamentos vinculados, `204` normal). Também testei os dois casos de erro esperado com dado real: tentar excluir "Aluguel" (item fixo com lançamentos) e "Moradia" (categoria em uso) — os dois vieram `409` com a mensagem amigável certa, sem eu precisar mexer em nada no backend. Limpei a categoria de teste no final; os dados reais ficaram intactos.
- **Não testei clicando na UI de verdade** — mesma limitação de sempre.

## Ação sua

- Dar uma olhada em `/categorias` e `/recorrentes` — o toggle "ativo/inativo" e o aviso de papel duplicado (edite um item fixo e mude o papel pra "Teto de adicionais" — já existe um ativo, "Gastos Adicionais" — deve aparecer o aviso).

## Próxima fase

Isso fecha todas as telas do MVP (§5 do plano). Fase 11 — Polish: estados vazios/loading/erro, QA em celular real, acessibilidade, os dois itens já anotados nesta sessão (Dialog de confirmação no lugar do `window.confirm`/`alert`, e navegação de mês além da janela de 12 meses), e dark mode (opcional). Só começo quando você der o sinal.
