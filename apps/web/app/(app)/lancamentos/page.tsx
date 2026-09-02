import { currentMonthKey } from '@orcamento/shared';
import { NewExpensePanel } from '@/components/lancamentos/NewExpensePanel';
import { PlaceholderView } from '@/components/shell/PlaceholderView';

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const month = mes ?? currentMonthKey();
  return (
    <div>
      <NewExpensePanel month={month} />
      <PlaceholderView title="Lançamentos" month={month} phase="Fase 7" />
    </div>
  );
}
