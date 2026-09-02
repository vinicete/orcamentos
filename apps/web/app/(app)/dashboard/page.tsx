import { currentMonthKey } from '@orcamento/shared';
import { DashboardView } from '@/components/dashboard/DashboardView';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const month = mes ?? currentMonthKey();
  return <DashboardView month={month} />;
}
