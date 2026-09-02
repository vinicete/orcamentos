# Fase 11 — Polish

Data: 2026-09-02

Fase de acabamento, sem tela nova — os itens do §5 do plano (estados vazios/loading/erro, acessibilidade) mais os dois pontos que ficaram anotados nas fases anteriores (Dialog de confirmação, navegação de mês além da janela de 12 meses). Dark mode (§4.4) fica de fora desta rodada — o próprio plano marca como opcional aqui ou V2, e o resto do escopo já era substancial.

## Diálogo de confirmação (shadcn Dialog)

Trocou o `window.confirm`/`window.alert` nativo (usado desde a Fase 7 pra excluir lançamento, e desde a Fase 10 também pra categoria/item fixo e erros de exclusão bloqueada) por um Dialog no padrão visual do app.

- `pnpm dlx shadcn add dialog` — mesmo tipo de atrito da Fase 6 com o `Sheet`: o gerado importava `@/components/ui/button` com `size="icon-sm"`/`variant="ghost"` (nosso `Button` não tem `size`), e o CLI tentou sobrescrever nosso `button.tsx` de novo (recusei). Corrigido removendo a dependência do `Button` no `dialog.tsx` (botão de fechar nativo, mesmo padrão do `SheetClose`), trocando `bg-black/10` por `bg-neutral-900/55` no overlay (mesma correção de fidelidade visual da Fase 6) e `rounded-xl`/`ring-1 ring-foreground/10` por `border-2 border-text` (o resto do app não usa sombra sutil pra separar camadas, usa borda grossa — `EntryList`, `SummaryRail`, `KpiStrip`, etc. — o Dialog devia seguir o mesmo idioma visual, não o do preset do shadcn).
- **`ConfirmProvider`** (`lib/confirm-context.tsx`), montado uma vez no `layout.tsx` raiz: expõe `useConfirmDialog()` com duas funções baseadas em Promise — `confirm(msg)` (Cancelar/Confirmar, resolve `boolean`) e `alert(msg)` (só OK, resolve `void`). Escolhi essa API de propósito pra trocar `if (!window.confirm(msg)) return;` por `if (!(await confirm(msg))) return;` nos call sites sem reescrever a lógica ao redor — só uma palavra `await` a mais em cada lugar.
- Atualizados: `EntryRow` (excluir lançamento), `CategoryRow` (excluir categoria + erro de exclusão bloqueada), `FixedItemRow` (excluir item fixo + erro de exclusão bloqueada + erro ao ativar/desativar). Nenhum `window.confirm`/`window.alert` sobrou no código (só uma menção em comentário).

## Navegação de mês além da janela de 12 meses

Era o ponto que você reportou (lançamento com data futura sumia da navegação) e que já estava anotado desde a Fase 7 (§0.4 #6 do plano: "navegação de ano" como encaminhamento).

`MonthTabs` não mostra mais "os últimos 12 meses a partir de hoje" (`lastNMonths(12)`) — mostra o **ano civil inteiro** (Jan–Dez) do ano selecionado, com um `‹ 2026 ›` pra trocar de ano. Isso resolve os dois lados do problema:

- **Data futura no ano corrente** (o caso que você reportou): antes, um lançamento em outubro/2026 ficava fora da janela porque hoje é setembro/2026; agora out/nov/dez/2026 sempre aparecem nas abas, sem precisar editar a URL.
- **Dados de outro ano** (passado ou futuro): os botões `‹`/`›` trocam o ano visível sem mudar o mês selecionado — só depois que você clica numa aba de fato o `?mes=` muda.

Implementação: estado local (`viewYear`) que realinha com o ano do `?mes=` quando ele muda de fora (ex.: veio de clicar numa barra da tela de Tendências) — usando o padrão de "ajustar estado durante o render" que o próprio React recomenda pra isso, não um `useEffect` com `setState` (a mesma regra de lint, `react-hooks/set-state-in-effect`, que já tinha aparecido na Fase 6, apareceu de novo aqui e foi resolvida do mesmo jeito).

**Fora do escopo, de propósito**: o `GET /dashboard/trend` da tela de Tendências continua com a janela rolante de 12 meses (não virou ano civil) — ali faz sentido diferente, é "evolução recente", não "encontrar um mês específico pra editar". Não mudei o endpoint nem o gráfico.

## Estados de erro nos carregamentos

Reparei, revisando o código de olho no "estados vazios/loading/erro" do plano, que **nenhum** dos `useEffect` de busca inicial das telas tinha tratamento de erro — se um `GET` falhasse (rede fora, sessão expirada, API fora do ar), a tela ficava travada em "Carregando…" pra sempre, sem nenhum aviso. Corrigido nos sete lugares que buscam o dado principal de cada tela: `use-expense-draft` (formulário de novo lançamento), `EntryList`, `SummaryRail`, `DashboardView`, `TrendsView`, `CategoriasView`, `RecorrentesView` — todos agora capturam o erro (`ApiError.message` quando a API responde, mensagem genérica em pt-BR quando não) e mostram em vermelho (`text-accent-700`) no lugar do conteúdo, em vez de deixar carregando pra sempre ou estourar um erro não tratado no console.

Não coloquei tratamento de erro nas buscas **secundárias** (ex.: a lista de categorias que `DashboardView`/`TrendsView` buscam só pra colorir; `RecorrentesView`/`use-expense-draft` buscando categorias pro `<select>`) — se essas falharem, a tela principal continua funcionando, só perde a cor/opção extra; não é um caso que merece travar a tela inteira.

Também adicionei mensagem de "nenhum item cadastrado" pra `CategoriasView`/`RecorrentesView` quando a lista vem vazia (edge case improvável — todo usuário já nasce com categorias padrão — mas evita a tela ficar em branco sem explicação se acontecer).

## Acessibilidade

- **Contraste**: medi a razão WCAG de todo texto em `neutral-400`/`neutral-500` contra os fundos reais do app (`--color-bg`/`--color-surface`) e achei 8 usos (o "×" de excluir em `EntryRow`/`CategoryRow`/`FixedItemRow`, o rótulo "pendente" em `EntryRow`/`FixedItemsTable`/`PendingFixedList`, o papel do item fixo e o estado "inativo" em `FixedItemRow`) abaixo até do mínimo de 3:1 pra elemento de UI (`neutral-400` deu **1.66–1.80:1**, `neutral-500` deu **2.38–2.59:1** — pra comparar, o mínimo do WCAG AA é 4.5:1 pra texto normal e 3:1 pra componente de interface). Troquei todos os 8 pra `neutral-700` (o mesmo tom já usado no resto do app pra texto secundário), que mede **5.38–5.83:1** — confortavelmente acima do mínimo.
- **`:focus-visible`**: já existia desde a Fase 5 (`outline: 2px solid var(--color-accent)` global) e cobre também as linhas clicáveis (`role="button" tabIndex={0}`) das listas — nada a mudar aqui.
- **Achado, não corrigido**: o texto claro (`--color-bg`) sobre fundo accent dos botões primários (`bg-accent text-bg`, usado em "Salvar"/"Adicionar"/"Confirmar" etc.) mede **3.76:1** — acima do mínimo de 3:1 pra texto grande/negrito, mas abaixo de 4.5:1 pra texto normal (e a maioria desses botões usa 13–15px, abaixo do limiar de "texto grande" do WCAG mesmo em negrito). Isso vem do par de cores da marca em si (`#ec3013`/`#f3f2f2`, herdado do Claude Design), não é algo que eu deva mudar por conta própria — é decisão de marca, não bug de implementação. Registrando pra você decidir se quer ajustar em algum momento (ex.: escurecer levemente o texto do botão, ou usar um tom de accent mais escuro no fundo).

## Verificação

- `pnpm build` (web) → limpo.
- `pnpm lint` / `pnpm format:check` (raiz) → limpos.
- `pnpm test` (`apps/api`) → 13/13, sem regressão (nada de backend mudou nesta fase).
- **Testado contra os servidores reais** (achei API e Web já rodando — de novo, não mexi neles): logei de verdade e busquei `/lancamentos`, `/categorias`, `/recorrentes`, `/dashboard` e `/tendencias` via HTTP, todos `200` (as duas primeiras passam por um redirect `307` de canonicalização de `?mes=` que já existia, sem relação com esta fase), sem nenhum marcador de erro de servidor no HTML — confirma que o `ConfirmProvider` novo no layout raiz não quebra o SSR de nenhuma página.
- Conferi no HTML gerado que o `MonthTabs` agora mostra `‹ 2026 ›` e as 12 abas Jan–Dez, incluindo Out/Nov/Dez — os meses que ficavam inacessíveis antes da correção.
- **Não testei clicando na UI de verdade** — mesma limitação de sempre (sem automação de navegador nesta sessão). Essa fase em particular tem mais coisa que só um clique real confirma (abrir o Dialog de confirmação, ver a animação, trocar de ano no seletor, ver a mensagem de erro aparecer de fato) — recomendo fortemente uma passada visual antes de ir pra Fase 12.

## Ação sua

- Testar o novo Dialog de confirmação (excluir um lançamento/categoria/item fixo) — layout, cores, teclado (Esc deveria fechar, já que é um `Dialog` do Base UI).
- Testar a navegação de ano no seletor de mês (`‹`/`›`) e confirmar que um lançamento de outubro/2026 (o caso que você reportou) agora aparece.
- Decidir se quer ajustar o contraste do texto claro sobre botão accent (achado acima) — ou deixar como está, já que é fiel ao design original.

## Próxima fase

Fase 12 — Deploy (Dockerfile da API, build da Vercel pro web, migrations no deploy, secrets, domínio). É a última fase do plano. Só começo quando você der o sinal.
