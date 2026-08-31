# PRD — App de Controle de Orçamento Pessoal

## 1. Contexto

Hoje o controle financeiro é feito em uma planilha (Google Sheets), com uma aba por mês. Cada aba tem três tabelas: **Gastos Fixos** (Orçado x Realizado), **Gastos Adicionais** (lançamentos avulsos) e **Gastos do Cartão** (compras no crédito). Recentemente foi adicionada uma coluna de Categoria em cada tabela para permitir agrupar e somar gastos.

A planilha funciona, mas tem atrito: lançar um gasto pelo celular é lento, cada mês vive em uma aba separada (o que já gerou inconsistência de estrutura entre meses), e qualquer visão nova (tendência, comparação, filtro) exige mexer em fórmula.

## 2. Problema

> Como usuária/usuário, quero registrar e visualizar meus gastos com o mínimo de fricção possível, e conseguir enxergar padrões (por categoria, por mês, orçado x realizado) sem precisar editar planilha.

## 3. Objetivo

Substituir a rotina de uso da planilha por um app simples de orçamento pessoal, mantendo os mesmos conceitos que já funcionam (fixo vs. avulso vs. cartão, categorias, orçado x realizado), mas com:
- Lançamento rápido (poucos toques, funciona bem no celular)
- Uma base de dados única (não uma aba por mês) — meses e anos viram apenas um filtro
- Visualizações prontas (categoria, mês, tendência, orçado x realizado) sem precisar montar nada manualmente

## 4. Não-objetivos (fora do escopo por enquanto)

- Sincronização automática com banco/cartão (Open Finance) ou importação de extrato
- OCR / leitura de nota fiscal / foto de recibo
- Múltiplos usuários, contas compartilhadas ou permissões
- App nativo iOS/Android (o app roda como artifact web, acessível também pelo navegador do celular)
- Suporte a múltiplas moedas

## 5. Usuário

Uso pessoal, um único usuário (você). Não há necessidade de login/autenticação multiusuário nesta fase.

## 6. Conceitos e modelo de dados

Mantendo a lógica que já existe na planilha, cada **lançamento** (expense) tem:

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `id` | string | sim | gerado automaticamente |
| `data` | date | sim | dia do gasto |
| `descrição` | texto | sim | ex: "uber isa", "Aluguel" |
| `valor` | número | sim | valor realizado (R$) |
| `categoria` | enum | sim | lista fixa, editável (ver §6.1) |
| `tipo` | enum | sim | `fixo` \| `adicional` \| `cartão` |
| `orçado` | número | não | usado só quando `tipo = fixo`, para comparar com o realizado |
| `recorrente` | booleano | não | se marcado, o item é sugerido automaticamente todo mês (ex: Aluguel, Internet) |

Um **mês/período** não é mais uma aba — é só um filtro sobre `data`. Isso resolve o problema de estrutura inconsistente entre meses.

### 6.1 Tipos de lançamento (`tipo`)

Esse é o conceito mais importante do modelo — vem direto das três tabelas que já existem na planilha e precisa ser preservado no app:

- **Gasto Fixo** (`fixo`): custo recorrente mensal, com Orçado x Realizado (Aluguel, Energia, Internet, Facul, Guardar, etc.). Um por item recorrente, todo mês.
- **Gasto Adicional** (`adicional`): gasto avulso do dia a dia, fora do cartão (ex: dinheiro, débito, Pix) — "uber isa", "ifood", "farmácia". Cada lançamento é individual, sem Orçado próprio. A **soma de todos os gastos adicionais do mês** é o que conta contra o limite mensal de "Gastos Adicionais" (esse limite continua existindo como um item do tipo `fixo`, exatamente como a linha "Gastos Adicionais" de hoje na planilha).
- **Gasto Adicional do Cartão** (`cartão`): gasto avulso feito no cartão de crédito. Também é lançado item a item (ex: "Acad", "Internet 5g", "Tropicadelia (4/6)"), e pode ter um Orçado próprio por item (parcela combinada, por exemplo). A soma desses lançamentos no mês é o que vira a **fatura**, que por sua vez é lançada como item do tipo `fixo` no mês seguinte ("Fatura mês passado") — igual acontece hoje na planilha.

Ou seja: `adicional` e `cartão` são conceitualmente irmãos — ambos são "gasto avulso do mês", a diferença é só a forma de pagamento (na mão/débito vs. crédito) — e cada um tem seu próprio rollup para dentro dos itens fixos (limite mensal de adicionais / fatura do mês seguinte).

### 6.2 Campo `orçado`

- Em `fixo`: sempre existe (é o orçamento do item recorrente).
- Em `cartão`: opcional, item a item (ex: uma parcela tem valor combinado fixo).
- Em `adicional`: não se aplica por item — o orçamento é controlado no agregado, via o item fixo "Gastos Adicionais".

### 6.3 Categorias (lista inicial, editável no app)

Moradia, Alimentação, Transporte, Saúde, Educação, Lazer, Compras/Pessoal, Assinaturas, Poupança/Investimento, Dívidas/Fatura, Família/Presentes, Outros.

O usuário pode adicionar, renomear ou remover categorias. Categoria é independente de tipo — um gasto `adicional` ou `cartão` pode ter qualquer categoria.

## 7. Funcionalidades — MVP

### 7.1 Lançar gasto
- Formulário simples: descrição, valor, categoria (seleção rápida, tipo "chips"), **tipo** (Fixo / Adicional / Adicional do Cartão), data (padrão: hoje).
- O tipo é a primeira escolha do formulário, já que muda o resto do fluxo:
  - **Fixo**: pede também o Orçado; se a descrição bater com um item recorrente já cadastrado (ex: "Aluguel"), pré-preenche o Orçado sozinho.
  - **Adicional**: só descrição, valor, categoria e data — sem Orçado. O app mostra, logo abaixo, quanto já foi gasto em "Adicionais" no mês vs. o limite definido no item fixo correspondente.
  - **Adicional do Cartão**: igual ao Adicional, mas com Orçado opcional por item (para parcelas com valor combinado). O app mostra o total acumulado no cartão no mês, que vai virar a fatura do mês seguinte.
- Deve funcionar bem em tela de celular (poucos campos, poucos toques).

### 7.2 Editar / excluir lançamento
- Lista de lançamentos do mês corrente, com edição e exclusão inline.

### 7.3 Itens fixos recorrentes
- Cadastro de itens fixos (nome + valor orçado) que se repetem todo mês (ex: Aluguel, Energia, Internet, Facul).
- No início de cada mês, esses itens aparecem automaticamente como pendentes de "realizado" (para o usuário só preencher o valor pago).

### 7.4 Dashboard do mês
- Total gasto no mês, comparado ao total orçado (fixos).
- Gasto por categoria (gráfico de barras ou pizza).
- Lista de maiores gastos do mês.

### 7.5 Evolução / tendência
- Gráfico de barras empilhadas (categoria x mês), como já existe na planilha hoje — mas gerado automaticamente a partir da base única, sem fórmula manual.
- Gráfico de linha com total gasto por mês.

### 7.6 Filtros
- Filtrar lançamentos por categoria, por tipo (fixo/adicional/cartão) e por intervalo de datas.

### 7.7 Persistência
- Dados salvos automaticamente (sem precisar de conta/login), acessíveis novamente ao reabrir o app no mesmo navegador/conta Claude.

## 8. Funcionalidades — V2 (depois do MVP)

- Alertas visuais quando uma categoria ultrapassa o orçado.
- Busca por texto nos lançamentos.
- Exportar dados para CSV/Excel (para quem quiser voltar a olhar em planilha).
- Importar o histórico atual da planilha (Fev–Ago) como carga inicial.
- Metas de poupança (acompanhar "Guardar"/"Reserva" como progresso, não só como categoria).
- Anotações/observações por lançamento (equivalente à coluna "Descrição" que já existe hoje).

## 9. Riscos / limitações conhecidas

- Como artifact, os dados ficam salvos por usuário no armazenamento do Claude — não é um backup tradicional em nuvem própria; vale ter export (V2) como rede de segurança.
- Sem importação automática no MVP, o histórico de Fev–Ago continua só na planilha até que a V2 (importação) seja feita.

## 10. Critério de sucesso

- Lançar um gasto leva menos tempo do que hoje na planilha.
- Não é mais necessário criar/ajustar fórmula nenhuma para ver total por categoria ou tendência mensal.
- App substitui o uso do dia a dia da planilha (a planilha pode continuar existindo como arquivo histórico).
