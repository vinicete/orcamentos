import { computeSummary, computeTrend, type ExpenseForAgg } from './dashboard.aggregations.js';
import { lastNMonths } from '../common/month-range.js';

function expense(overrides: Partial<ExpenseForAgg> & Pick<ExpenseForAgg, 'id'>): ExpenseForAgg {
  return {
    description: overrides.id,
    amount: 0,
    budget: null,
    type: 'ADICIONAL',
    status: 'REALIZADO',
    date: new Date('2026-08-15'),
    categoryId: 'cat-1',
    categoryName: 'Categoria',
    fixedItemRole: null,
    ...overrides,
  };
}

describe('computeSummary', () => {
  it('exclui o teto de Adicionais do gasto do mês, mas inclui o orçamento dele no total orçado', () => {
    const expenses: ExpenseForAgg[] = [
      expense({
        id: 'ceiling',
        type: 'FIXO',
        amount: 250,
        budget: 300,
        fixedItemRole: 'ADDITIONAL_CEILING',
      }),
      expense({ id: 'aluguel', type: 'FIXO', amount: 700, budget: 700 }),
    ];

    const summary = computeSummary('2026-08', expenses);

    expect(summary.totalSpent).toBe(700); // sem a linha de teto
    expect(summary.totalBudget).toBe(1000); // 300 (teto) + 700 (aluguel)
    expect(summary.additionalCeiling).toBe(300);
  });

  it('inclui a fatura do cartão (CARD_INVOICE) no gasto do mês, ao contrário do teto', () => {
    const expenses: ExpenseForAgg[] = [
      expense({
        id: 'fatura',
        type: 'FIXO',
        amount: 582,
        budget: 582,
        fixedItemRole: 'CARD_INVOICE',
      }),
    ];

    const summary = computeSummary('2026-08', expenses);

    expect(summary.totalSpent).toBe(582);
  });

  it('soma adicionais e compara com o teto', () => {
    const expenses: ExpenseForAgg[] = [
      expense({
        id: 'ceiling',
        type: 'FIXO',
        amount: 0,
        budget: 300,
        fixedItemRole: 'ADDITIONAL_CEILING',
      }),
      expense({ id: 'uber', amount: 40 }),
      expense({ id: 'ifood', amount: 60 }),
    ];

    const summary = computeSummary('2026-08', expenses);

    expect(summary.additionalSpent).toBe(100);
    expect(summary.additionalPct).toBeCloseTo(100 / 300);
  });

  it('exclui rollups (teto e fatura) da quebra por categoria e do top de gastos', () => {
    const expenses: ExpenseForAgg[] = [
      expense({
        id: 'ceiling',
        type: 'FIXO',
        amount: 250,
        budget: 300,
        fixedItemRole: 'ADDITIONAL_CEILING',
        categoryId: 'outros',
        categoryName: 'Outros',
      }),
      expense({
        id: 'fatura',
        type: 'FIXO',
        amount: 582,
        budget: 582,
        fixedItemRole: 'CARD_INVOICE',
        categoryId: 'dividas',
        categoryName: 'Dívidas/Fatura',
      }),
      expense({ id: 'uber', amount: 40, categoryId: 'transporte', categoryName: 'Transporte' }),
    ];

    const summary = computeSummary('2026-08', expenses);

    expect(summary.categories).toEqual([
      { categoryId: 'transporte', name: 'Transporte', total: 40, pct: 1 },
    ]);
    expect(summary.topExpenses.map((e) => e.id)).toEqual(['uber']);
  });

  it('limita o top de gastos a 7 itens, ordenados do maior pro menor', () => {
    const expenses = Array.from({ length: 10 }, (_, i) => expense({ id: `e${i}`, amount: i + 1 }));

    const summary = computeSummary('2026-08', expenses);

    expect(summary.topExpenses).toHaveLength(7);
    expect(summary.topExpenses[0].id).toBe('e9'); // amount 10, o maior
    expect(summary.topExpenses.map((e) => e.amount)).toEqual([10, 9, 8, 7, 6, 5, 4]);
  });

  it('marca delta como null pra fixos pendentes, e calcula orçado-realizado pros demais', () => {
    const expenses: ExpenseForAgg[] = [
      expense({ id: 'pendente', type: 'FIXO', amount: 0, budget: 70, status: 'PENDENTE' }),
      expense({ id: 'pago', type: 'FIXO', amount: 56, budget: 60, status: 'REALIZADO' }),
    ];

    const summary = computeSummary('2026-08', expenses);

    const pendente = summary.fixedItems.find((f) => f.id === 'pendente')!;
    const pago = summary.fixedItems.find((f) => f.id === 'pago')!;
    expect(pendente.delta).toBeNull();
    expect(pago.delta).toBe(4);
    expect(summary.pending).toEqual([{ id: 'pendente', description: 'pendente', budget: 70 }]);
    expect(summary.pendingCount).toBe(1);
  });

  it('não quebra com mês sem nenhum lançamento', () => {
    const summary = computeSummary('2026-08', []);

    expect(summary.totalSpent).toBe(0);
    expect(summary.budgetPct).toBe(0);
    expect(summary.additionalPct).toBe(0);
    expect(summary.categories).toEqual([]);
    expect(summary.topExpenses).toEqual([]);
  });
});

describe('computeTrend', () => {
  it('soma por mês e por categoria, excluindo rollups', () => {
    const byMonth = new Map<string, ExpenseForAgg[]>([
      [
        '2026-07',
        [
          expense({ id: 'a', amount: 100, categoryId: 'food', categoryName: 'Alimentação' }),
          expense({
            id: 'ceiling',
            type: 'FIXO',
            amount: 250,
            fixedItemRole: 'ADDITIONAL_CEILING',
          }),
        ],
      ],
      [
        '2026-08',
        [expense({ id: 'b', amount: 50, categoryId: 'food', categoryName: 'Alimentação' })],
      ],
    ]);

    const trend = computeTrend(['2026-07', '2026-08'], byMonth);

    expect(trend.months).toEqual([
      {
        month: '2026-07',
        total: 100,
        byCategory: [{ categoryId: 'food', name: 'Alimentação', total: 100 }],
      },
      {
        month: '2026-08',
        total: 50,
        byCategory: [{ categoryId: 'food', name: 'Alimentação', total: 50 }],
      },
    ]);
    expect(trend.average).toBe(75);
  });

  it('meses sem lançamento entram com total zero, não somem da série', () => {
    const trend = computeTrend(['2026-06', '2026-07'], new Map());

    expect(trend.months).toEqual([
      { month: '2026-06', total: 0, byCategory: [] },
      { month: '2026-07', total: 0, byCategory: [] },
    ]);
    expect(trend.average).toBe(0);
  });
});

describe('lastNMonths', () => {
  it('gera os últimos N meses em ordem cronológica, terminando no mês âncora', () => {
    expect(lastNMonths(3, new Date('2026-08-15'))).toEqual(['2026-06', '2026-07', '2026-08']);
  });

  it('atravessa virada de ano corretamente', () => {
    expect(lastNMonths(3, new Date('2027-01-10'))).toEqual(['2026-11', '2026-12', '2027-01']);
  });

  it('n=1 retorna só o mês âncora', () => {
    expect(lastNMonths(1, new Date('2026-08-15'))).toEqual(['2026-08']);
  });
});
