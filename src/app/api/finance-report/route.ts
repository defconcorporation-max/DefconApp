import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFinanceData } from '@/app/actions';

export const dynamic = 'force-dynamic';

/**
 * Generates financial report data as JSON.
 * A client-side PDF renderer uses @react-pdf/renderer to build the actual PDF.
 */
export async function GET() {
    const session = await auth();
    if (!session || (session.user?.role !== 'Admin' && session.user?.role !== 'Team')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const financeData = await getFinanceData();

        const report = {
            generatedAt: new Date().toISOString(),
            period: `${new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}`,
            stats: financeData.stats,
            topClients: financeData.clients?.slice(0, 10) || [],
            projects: financeData.projects?.slice(0, 20) || [],
            revenueChart: financeData.revenueChart || [],
            expenses: financeData.expensesList?.slice(0, 20) || [],
        };

        return NextResponse.json(report);
    } catch (error) {
        console.error('Finance report generation failed:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
