import { getTeamWorkload } from '@/app/scheduling-actions';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import WorkloadDashboard from '@/components/team/WorkloadDashboard';

export const dynamic = 'force-dynamic';

export default async function TeamWorkloadPage() {
    const { members, workload, startDate, endDate, error } = await getTeamWorkload();

    if (error) {
        return <div className="p-8 text-red-500">Failed to load workload data: {error}</div>;
    }

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <header className="mb-8 max-w-[1400px]">
                <div className="flex justify-between items-center mb-4">
                    <Link href="/team" className="text-[var(--text-tertiary)] hover:text-white transition-colors flex items-center gap-2 text-sm font-mono">
                        <ArrowLeft size={16} /> Back to Team
                    </Link>
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Users className="text-indigo-400" />
                        Team Workload
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">Forecast based on assigned shoots and tasks.</p>
                </div>
            </header>

            <WorkloadDashboard
                members={members}
                workload={workload}
                startDateStr={startDate || ''}
                endDateStr={endDate || ''}
            />
        </main>
}
