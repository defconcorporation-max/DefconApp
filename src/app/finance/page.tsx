
import { getFinanceData, getSettings, getAllCommissions } from '@/app/actions';
import Link from 'next/link';
import FinanceTabs from '@/components/FinanceTabs';
import { Commission } from '@/types';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
    const data = await getFinanceData();
    const commissions = await getAllCommissions();
    const settings = await getSettings();

    // Map project values for CommissionTracker
    const projectValues: Record<number, number> = {};
    data.projects.forEach((p: any) => {
        projectValues[p.id] = p.total_value_pre_tax;
    });

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <header className="mb-8 border-b border-[var(--border-subtle)] pb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Finance Overview</h1>
                    <p className="text-[var(--text-secondary)] text-sm">Track revenue, pending income, and client performance.</p>
                </div>
                <Link href="/" className="text-sm font-mono text-[var(--text-tertiary)] hover:text-white transition-colors">
                    ← BACK TO DASHBOARD
                </Link>
            </header>

            <FinanceTabs
                data={data}
                commissions={commissions}
                settings={settings}
                projectValues={projectValues}
            />
        </main>
    );
}


