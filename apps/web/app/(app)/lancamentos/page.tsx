import { currentMonthKey } from '@orcamento/shared';
import { PlaceholderView } from '@/components/shell/PlaceholderView';

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  return <PlaceholderView title="Lançamentos" month={mes ?? currentMonthKey()} phase="Fase 6/7" />;
}
