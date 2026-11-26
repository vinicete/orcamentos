# Fase 14.3 — Textos

Data: 2026-11-26

O hero do login já tinha entrado na 14.8 (2026-11-24). Aqui entram o resto da lista do plano e os
casos achados numa varredura de todas as strings visíveis de `apps/web` (texto em JSX, `placeholder`,
`aria-label`, mensagens de erro e dicas).

## O que mudou

| Onde                             | Antes                                                                                  | Depois                                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `layout.tsx` (descrição do site) | "Controle de orçamento pessoal — fixo, adicional e cartão numa base só."               | subtítulo do hero                                                                                               |
| Formulário, dica                 | "Tipo primeiro — depois é uma linha e Enter."                                          | removida                                                                                                        |
| Formulário, descrição            | placeholder "uber isa"                                                                 | "ex.: mercado"                                                                                                  |
| Formulário, botão                | "ADD ↵" / "..."                                                                        | "LANÇAR ↵" / "Salvando…"                                                                                        |
| Formulário, orçado               | "Orçado (opc.)"                                                                        | "Orçado (opcional)"                                                                                             |
| Dica do fixo                     | "Fixo exige orçado. Digite um nome já cadastrado pra preencher sozinho."               | "Fixo precisa de um valor orçado. Digite o nome de um recorrente pra preencher sozinho."                        |
| Dica do fixo preenchido          | "Orçado preenchido a partir do item fixo cadastrado."                                  | "Orçado preenchido pelo recorrente."                                                                            |
| Erro do fixo                     | "Fixo exige orçado."                                                                   | "Informe o orçado do fixo."                                                                                     |
| Recorrentes                      | "item fixo" / "itens fixos"                                                            | "recorrente" / "recorrentes"                                                                                    |
| Recorrentes, aviso               | "Já existe outro item com esse papel — só o primeiro entra nos cálculos do dashboard." | "Já existe um recorrente marcado como {Teto de adicionais \| Fatura do cartão}. Só o primeiro conta no Resumo." |
| Menu                             | "Dashboard"                                                                            | "Resumo" (rota `/dashboard` mantida)                                                                            |
| Rail                             | "Total x orçado", "Cartão acumulado"                                                   | "Gasto × orçado", "Cartão no mês"                                                                               |
| Lançamentos                      | "Fixos pendentes"                                                                      | "A pagar"                                                                                                       |
| Lista, erro                      | "Erro ao carregar"                                                                     | "Não foi possível carregar."                                                                                    |
| Filtro                           | "Todas categorias"                                                                     | "Todas as categorias"                                                                                           |
| Resumo, tabela                   | "Fixos · orçado x realizado", coluna "Delta"                                           | "Fixos · orçado × gasto", "Diferença"                                                                           |
| Resumo, KPI                      | "Nº de lançamentos"                                                                    | "Lançamentos"                                                                                                   |
| Resumo, erro                     | "Não foi possível carregar o dashboard."                                               | "…o resumo."                                                                                                    |
| Botões Salvar/Adicionar          | "..."                                                                                  | "Salvando…" / "Adicionando…"                                                                                    |
| API, categoria em uso (409)      | "Categoria em uso por lançamentos ou itens fixos — não pode ser removida."             | "Esta categoria está em uso por lançamentos ou recorrentes e não pode ser excluída."                            |

- `PlaceholderView` removido (nenhuma tela usava).
- Comentário do aviso de papel duplicado em `FixedItemRow` encurtado.

## Verificação

- `pnpm lint`, prettier, build do web e da API: limpos. Nenhum teste dependia da mensagem da API.
- A mensagem da API só muda em produção depois do deploy na VM; o resto sai pela Vercel.
- Não abri no navegador.
