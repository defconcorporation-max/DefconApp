import { getShootVolumeData, getProjectOriginData, getProjectCompletionData, getMonthlyRevenueData, getTopClientsData, getTeamUtilizationData } from '@/app/actions';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import { Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    const volumeData = await getShootVolumeData();
    const originData = await getProjectOriginData();
    const completionData = await getProjectCompletionData();
    const revenueData = await getMonthlyRevenueData();
    const topClientsData = await getTopClientsData();
    const teamUtilizationData = await getTeamUtilizationData();

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white pb-20">
            <header className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                        <p className="text-[var(--text-tertiary)] mt-1">Operational insights and volume tracking</p>
                    </div>
                </div>
            </header>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AnalyticsCharts
                    volumeData={volumeData}
                    originData={originData}
                    completionData={completionData}
                    revenueData={revenueData}
                    topClientsData={topClientsData}
                    teamUtilizationData={teamUtilizationData}
                />
            </div>
        </main>
    );
}
