import { currentMonthKey } from '@orcamento/shared';
import { TrendsView } from '@/components/tendencias/TrendsView';

export default async function TendenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const month = mes ?? currentMonthKey();
  return <TrendsView month={month} />;
}
