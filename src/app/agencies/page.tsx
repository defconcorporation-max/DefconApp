import { getAgencies, getAgencyStats } from '@/app/actions';
import AgencyList from '@/components/AgencyList';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AgenciesPage() {
    const session = await auth();
    if (!session) redirect('/login');
    const role = session.user?.role;
    if (role !== 'Admin' && role !== 'Team') redirect('/');
    const agencies = await getAgencies();
    const agencyStats = await getAgencyStats();

    return (
        <main className="min-h-screen pb-20 bg-[var(--bg-root)]">
            <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-root)] sticky top-0 z-50">
                <div className="pro-container h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-gradient-to-b from-indigo-500 to-violet-600 rounded-full"></span>
                        Agencies
                    </h1>
                </div>
            </header>

            <div className="pro-container py-8">
                <AgencyList agencies={agencies} stats={agencyStats} />
            </div>
        </main>
    );
}
