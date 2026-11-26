# Fase 14.10 — Polimento visual

Data: 2026-11-26

Só aparência, nada de comportamento. Entrou fora da ordem do plano, a seu pedido.

## O que foi feito

- **Números alinhados:** `font-variant-numeric: tabular-nums` no `body`. Valores em lista e tabela
  passam a ter dígitos da mesma largura. Conferi no build que o arquivo da Archivo usado (subconjunto
  latino) tem o recurso `tnum`; os subconjuntos latin-ext e vietnamita não têm, mas não carregam
  dígitos.
- **Texto mínimo de 11 px:** os 18 usos de 9 e 10 px subiram para 11 px (rótulos do formulário de
  lançar, cabeçalho da tabela de fixos, etiqueta "pendente", papel do recorrente, eixos dos gráficos).
  Exceção: os valores em cima das barras e dos pontos de Tendências ficam 10 px no celular (12 colunas
  em ~340 px não cabem em 11) e 11 px a partir de `md`.
- **Alturas:** botões e campos de 36 px (`min-h-9`) viraram 44 px no celular e 40 px no desktop
  (`min-h-11 md:min-h-10`). Botão de menu e de tema idem. O "fechar" de modal e sheet foi de 28 px
  para 40 px.
- **Espaçamento de letras:** `.04em` e `.06em` viraram `.08em`; `.14em` virou `.1em`. Ficam dois
  valores para maiúsculas (`.08em` e `.1em`) e os negativos dos títulos grandes.
- **Barra do navegador no celular:** o script do tema (`lib/theme.ts`) cria o `<meta name="theme-color">`
  e o mantém igual ao fundo (claro `#f3f2f2`, escuro `#171515`), observando a classe `.dark`. Não usei
  o `themeColor` do `viewport` do Next porque ele só segue o tema do sistema, não a escolha salva.
- **Logo:** o "." de "ORÇAMENTO." virou um quadrado vermelho do tamanho proporcional, igual ao favicon.

## Verificação

- `pnpm lint`, prettier e `pnpm --filter @orcamento/web build`: limpos.
- **Não abri no navegador.** Vale conferir: header no celular (o botão de menu ficou 8 px maior), linha
  de lançamento em edição, gráficos de Tendências em 375 px e a cor da barra do Chrome/Safari no
  celular ao trocar o tema.
