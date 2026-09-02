import { currentMonthKey } from '@orcamento/shared';
import { LancamentosView } from '@/components/lancamentos/LancamentosView';

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const month = mes ?? currentMonthKey();
  return <LancamentosView month={month} />;
}
