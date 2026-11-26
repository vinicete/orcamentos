# Plano — Melhorias de produto e interface (Fase 14)

Complemento do [PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md) e do [PLANO_AUTH.md](PLANO_AUTH.md).
Entra depois da Fase 13.

**Tudo aqui é só front** (`apps/web`, eventualmente `packages/shared`): a API já expõe o que é
preciso. Cada etapa vai pra produção sozinha pela Vercel ao mergear na `main`, sem deploy na VM.
A única ideia que exigiria backend (orçamento por categoria, precisa de migration) ficou de fora,
em §4.

**Andamento:** 14.8 feita em 2026-11-24; 14.3 e 14.10 em 2026-11-26 (logs em `docs/log/`). O resto
aguarda aprovação do protótipo.

## 0. Diagnóstico (o que motivou o plano)

| # | Problema | Onde |
|---|---|---|
| 1 | `ensure-month` nunca é chamado pela UI: no mês novo os fixos não aparecem como pendentes, o orçado do mês fica R$ 0 e o teto de adicionais também | nenhum componente usa `api.ensureMonth` |
| 2 | No celular (e em qualquer tela < 1120px) o resumo do mês some: sem orçado, sem teto, sem pendentes. O Dashboard também não mostra orçado nem teto | `SummaryRail` (`hidden … min-[1120px]:block`), `KpiStrip` |
| 3 | Dois totais diferentes pro mesmo mês sem explicação: a lista soma tudo (inclui cartão e linhas de teto/fatura), o "Gasto do mês" não | `EntryList`, `KpiStrip` |
| 4 | Hero do login com tradução literal ("Um só livro") e frase de arquitetura ("o mês é só um filtro"); rodapé repete o rótulo do topo | `AuthShell` |
| 5 | Textos internos/mistos: placeholder "uber isa", "ADD ↵", "Delta", "Tipo primeiro — depois é uma linha e Enter." | `QuickEntryRow`, `QuickEntrySheet`, `FixedItemsTable` |
| 6 | Vermelho em todo título de seção, então o vermelho de "estourou" perde força (contraria o §4.2 do plano original) | `SectionLabel` com `text-accent` em toda parte |
| 7 | Mês sem dados vira página em branco no Dashboard; carregamento é texto puro e faz a tela pular | `DashboardView` e seções que retornam `null` |
| 8 | O mesmo `getDashboardSummary` é buscado três vezes na tela de Lançamentos | `SummaryRail`, `useExpenseDraft`, (e o Dashboard) |

## 1. Decisões que preciso de você antes de começar

1. **Hero do login.** ✅ Decidido: **TODO GASTO CONTA.** / "Do aluguel ao cafezinho: fixos,
   adicionais e cartão no mesmo lugar." (escolhido entre 9 opções do protótipo).
2. **Quando gerar os fixos do mês.** Recomendo: automático só pro **mês atual** (ao abrir
   Lançamentos ou Dashboard); pra qualquer outro mês, um botão "Gerar fixos deste mês" no estado
   vazio. Gerar automático em qualquer mês clicado encheria meses futuros/antigos de pendências só
   por navegar nas abas.
3. **Total da lista de lançamentos.** Recomendo: a lista mostra só a contagem e a "soma do que está
   listado" (útil com filtros), e o total oficial do mês passa a morar no resumo (14.2), com o mesmo
   número do Dashboard.
4. **Dark mode e PWA (14.8 e 14.9)** entram agora ou ficam pra depois? ✅ Dark mode entrou
   (14.8 feita). PWA ainda em aberto.

## 2. Etapas

### 14.1 — Fixos do mês gerados automaticamente

- Hook `useEnsureMonth(month)` usado por `LancamentosView` e `DashboardView`: chama
  `api.ensureMonth` uma vez por mês por sessão (cache em módulo da promise por `month`, pra que as
  duas telas e o StrictMode compartilhem a mesma requisição) e só depois libera a busca do summary.
- Aplica a regra da decisão §1.2 (automático só no mês atual).
- Se `skipped` vier com itens (fixo ativo sem categoria), avisar com um texto discreto apontando pra
  Recorrentes, em vez de engolir.
- Risco: o endpoint não tem constraint única; duas abas abertas ao mesmo tempo no mesmo mês podem
  criar duplicata. O cache por promise resolve dentro da aba; entre abas é raro o bastante pra
  aceitar.
- **Verificação:** num mês sem fixos (local), abrir Lançamentos → pendências aparecem, orçado e teto
  deixam de ser R$ 0; recarregar não duplica; navegar pra um mês futuro não cria nada.

### 14.2 — Resumo do mês visível em qualquer tela

- Subir a busca do summary pra `LancamentosView` (uma requisição só) e passar pra rail, formulário
  (hint) e o novo resumo. Resolve o problema #8.
- Novo `MonthSummaryBar` acima do formulário, só abaixo de 1120px: gasto × orçado com barra,
  adicionais × teto com barra, cartão do mês. Linha "N fixos pendentes" que expande o
  `PendingFixedList` (quitar direto, como na rail).
- Desktop continua com a rail como está.
- Lista de lançamentos: aplica a decisão §1.3.
- **Verificação:** em 375px e 768px o resumo aparece, quitar um pendente atualiza resumo e lista;
  no desktop nada muda além de uma requisição a menos.

### 14.3 — Textos ✅

Feita em 2026-11-26, log em [fase-14-3-textos.md](log/fase-14-3-textos.md).

- `AuthShell`: hero escolhido em §1.1; rodapé virou "Fixo · Adicional · Cartão".
- `app/layout.tsx`: `metadata.description` igual ao subtítulo do hero.
- Formulário: placeholder "ex.: mercado"; "ADD ↵" → "LANÇAR ↵"; dica do topo removida;
  "Orçado (opc.)" → "Orçado (opcional)"; dicas e erro do fixo reescritos.
- "item fixo" → "recorrente" em toda a UI (mesmo nome da tela no menu).
- Menu "Dashboard" → "Resumo" (a rota continua `/dashboard`).
- Títulos: "Gasto × orçado", "Cartão no mês", "A pagar", "Fixos · orçado × gasto", "Diferença",
  KPI "Lançamentos".
- Botões mostram "Salvando…"/"Adicionando…" em vez de "...".
- Removido `PlaceholderView` (não era usado).
- Uma mensagem da API (categoria em uso) também mudou: só aparece depois do deploy na VM.

### 14.4 — Hierarquia de cor e lista

- `SectionLabel` passa a usar `text-text` por padrão; accent fica reservado pra ação principal,
  item ativo (aba/nav), estouro (`MeterBar` acima do máximo, diferença positiva) e erro.
- Pendentes na lista de lançamentos: agrupados no topo, valor orçado em cinza e ação "pagar"
  explícita no lugar do "—" com "pendente" minúsculo.
- Avaliar agrupar o restante da lista por dia (cabeçalho de data) — decidir vendo na tela, não aqui.
- **Verificação:** olhar Lançamentos, Dashboard e Tendências lado a lado: o único vermelho forte
  deve ser ação, seleção ou problema.

### 14.5 — Dashboard

- `KpiStrip` passa a ter:
  - Gasto × orçado (com barra);
  - Adicionais × teto (com barra);
  - Cartão do mês (nº de compras, "vira a fatura do mês que vem");
  - Comparação com o mês anterior (Δ% do `totalSpent`), via segunda chamada de
    `getDashboardSummary` pro mês anterior. Não usar `/dashboard/trend`: o total de lá é por
    competência (inclui cartão) e não bate com o "Gasto do mês".
- Sai o "Nº de lançamentos".
- Alerta de fixo estourado: contagem "N fixos acima do orçado" no topo, com os itens destacados na
  tabela (o dado já vem em `fixedItems[].delta`).
- Helper de mês anterior em `packages/shared/src/date.ts` (com teste, se for lógica não trivial).
- **Verificação:** conferir os números de um mês do seed contra a planilha original.

### 14.6 — Estados vazios, carregamento e acessibilidade

- Esqueletos com a forma dos cards no lugar de "Carregando…" (KPIs, rail/resumo, lista).
- Dashboard sem dados: mensagem + atalhos ("Lançar gasto", "Gerar fixos deste mês" pela regra da
  14.1).
- Usuário novo com teto R$ 0: dica apontando pra Recorrentes pra definir o teto.
- Reavaliar `maximumScale: 1` no viewport (bloqueia pinch-zoom). Foi posto por causa do zoom preso no
  login no Android; a regra de 16px nos inputs pode já bastar. Só remover depois de testar num
  Android real.
- **Verificação:** conta nova do zero (registrar → primeiro acesso) e um mês vazio.

### 14.7 — Exportar CSV

- Botão em Lançamentos: "Exportar mês" (respeita os filtros ativos) e "Exportar tudo"
  (`getExpenses()` sem `month`).
- Gerado no navegador (Blob), formato que o Excel pt-BR abre direto: separador `;`, vírgula
  decimal, BOM UTF-8.
- Colunas: data, descrição, tipo, categoria, valor, orçado, status.
- Serve também de backup manual enquanto o banco da VM não tem cópia externa.
- **Verificação:** abrir o arquivo no Excel e no Google Sheets; acentos e valores corretos.

### 14.8 — Dark mode ✅

- Tokens redefinidos sob `.dark` em `globals.css` (paleta do protótipo): fundo `#171515`,
  vermelho `#ff563c`, escala `neutral` e `accent-100…900` invertidas.
- Cores de categoria viraram variáveis `--color-cat-N`; `getCategoryColor` devolve
  `var(--color-cat-N, hex)` e o escuro tem um segundo mapa (as categorias escuras ficam claras).
- Tokens que não mudam de tema: `brand`/`on-brand` (painel do login) e `scrim` (fundo de modal).
- Botão sol/lua no header (desktop) e no menu (mobile), salvo em `localStorage` (`tema`). Sem
  escolha salva, segue o sistema e acompanha se ele mudar. Ficou com dois estados em vez de
  claro/escuro/sistema: pra voltar a "seguir o sistema" basta limpar a escolha (não há botão).
- Script inline no `<head>` do `app/layout.tsx` aplica a classe antes da primeira pintura.

### 14.10 — Polimento visual ✅

Fora do plano original, pedido em 2026-11-26. Só aparência, log em
[fase-14-10-polimento-visual.md](log/fase-14-10-polimento-visual.md).

- Números com largura fixa (`tabular-nums` no `body`).
- Texto mínimo de 11 px (gráficos de Tendências: 10 px no celular por falta de espaço).
- Alturas de botão e campo: 44 px no celular, 40 px no desktop.
- Espaçamento de letras em maiúsculas: só `.08em` e `.1em`.
- `theme-color` acompanhando o tema; ponto do logo vira quadrado, igual ao favicon.

### 14.9 — PWA instalável (opcional)

`manifest` (rota de metadata do Next — conferir em `node_modules/next/dist/docs/` antes),
ícones, `theme-color`. Sem service worker/offline: o app depende da API de qualquer jeito.

## 3. Ordem sugerida

14.1 → 14.2 → 14.3 corrigem o que está quebrado ou confuso hoje e são pequenas (14.1 e 14.3 dá pra
fazer juntas). 14.4 e 14.5 mexem no visual e dependem do resumo da 14.2 existir. 14.6 fecha o
polimento. 14.7 é independente e pode ser antecipada se o backup preocupar. 14.8/14.9 só se você
quiser.

Cada etapa: `pnpm lint`, `pnpm --filter @orcamento/web build`, conferência manual em 375px e
desktop, log em `docs/log/fase-14-N-*.md`.

## 4. Fora deste plano

- **Orçamento por categoria** (alerta quando uma categoria passa do limite): precisa de campo novo
  no banco, migration e deploy manual na VM. Vira plano próprio se você quiser.
- **Metas de poupança** e **anotações por lançamento** (V2 do PRD): também mexem no schema.
