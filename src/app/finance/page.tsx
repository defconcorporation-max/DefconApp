import { getAllCommissions, getFinanceData } from '@/app/actions';
import FinanceTabs from '@/components/FinanceTabs';
import PageLayout from '@/components/layout/PageLayout';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const data = await getFinanceData();
  const commissions = await getAllCommissions();

  const projectValues = Object.fromEntries(
    (data.projects || []).map((p: any) => [p.id, p.total_value ?? 0])
  ) as Record<number, number>;

  return (
    <PageLayout
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Finance' },
      ]}
      title="Finance"
      subtitle="Cash collected, paiements et commissions."
      compact
    >
      <FinanceTabs
        data={data}
        commissions={commissions}
        settings={data.settings}
        projectValues={projectValues}
      />
    </PageLayout>
  );
}

