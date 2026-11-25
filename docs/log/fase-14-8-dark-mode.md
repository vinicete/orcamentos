# Fase 14.8 — Dark mode (e hero do login)

Data: 2026-11-24

Fora da ordem do [plano](../PLANO_MELHORIAS_FRONT.md): você aprovou só o hero e o dark mode do
protótipo, o resto da Fase 14 continua aguardando.

## Hero do login (parte da 14.3)

- `AuthShell`: "TODO GASTO / CONTA." + "Do aluguel ao cafezinho: fixos, adicionais e cartão no mesmo
  lugar." Rodapé trocado de "Controle de orçamento pessoal" (repetia o topo) para "Fixo · Adicional ·
  Cartão".
- `metadata.description` do `app/layout.tsx` não foi mexida (o resto da 14.3 fica pra depois).

## Dark mode

- **Estratégia:** classe `.dark` no `<html>`, a mesma do `@custom-variant dark` que já existia. Em vez
  de espalhar `dark:` pelos componentes, o bloco `.dark` em `globals.css` redefine os tokens do
  `@theme`. Como as utilities do Tailwind v4 leem `var(--color-*)`, todos os componentes trocam de
  tema sem alteração. Funciona porque nenhum componente tinha cor literal.
- **Paleta:** a do quadro "Dark mode" do protótipo. `neutral` invertida (o `text-neutral-700` dos
  textos secundários vira `#aaa5a5`), `accent-700` (texto de erro/estouro) vira `#ff9783`,
  `accent-600` (hover do botão) fica mais claro que o vermelho base, sombras em preto.
- **Tokens fixos:** o painel vermelho do login usava `bg-accent text-bg`, que no escuro viraria
  vermelho claro com texto escuro. Criei `brand`/`on-brand` (mesmos valores do tema claro, sem
  override). O fundo de modal/sheet usava `bg-neutral-900/55`, que no escuro ficaria claro; agora é
  `bg-scrim/55`.
- **Categorias:** `getCategoryColor` (`packages/shared`) passou a devolver
  `var(--color-cat-N, #hex)`. Os 4 usos são `style={{ backgroundColor }}`, então `var()` funciona.
  O hex fica como fallback. As variáveis claras ficam num `:root` comum e não no `@theme`: o Tailwind
  descarta token de `@theme` sem utility usada, e essas só são lidas por style inline (conferido no
  CSS do build, as claras tinham sumido na primeira versão).
- **Sem piscar:** `THEME_INIT_SCRIPT` (`lib/theme.ts`) roda no `<head>` antes da pintura, como no
  guia `preventing-flash-before-hydration` do Next 16. `<html>` ganhou `suppressHydrationWarning`
  porque o script muda a classe antes da hidratação.
- **Toggle:** `ThemeToggle` (sol/lua) no header desktop ao lado de "Sair" e no rodapé do menu mobile.
  Lê o estado com `useSyncExternalStore` observando a classe do `<html>` (sem setState em effect).
  Salva `tema` = `claro`/`escuro` no `localStorage`. Sem escolha salva, segue
  `prefers-color-scheme` e acompanha mudanças do sistema.
- `color-scheme` claro/escuro no `:root`/`.dark`: inputs nativos, `<select>` e scrollbar acompanham.

## Verificação

- `pnpm lint` e prettier nos arquivos tocados: limpos.
- `pnpm --filter @orcamento/web build`: limpo. Conferi no CSS gerado o bloco `.dark`, as utilities
  `bg-brand`/`text-on-brand`/`bg-scrim/55` e as duas versões de `--color-cat-*`, e o script no HTML
  estático do `/login`.
- **Não abri no navegador.** Vale conferir: login no escuro (painel continua vermelho), Lançamentos e
  Dashboard com as barras de categoria, o sheet de lançamento no mobile e um modal de confirmação.

## Ação sua

- Testar o toggle em desktop e 375px, e recarregar a página no escuro pra ver que não pisca branco.
