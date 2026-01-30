import { getAllShoots, getTeamMembers, getAllShootAssignments } from '@/app/actions';
import Link from 'next/link';
import { Video } from 'lucide-react';
import ShootAssignmentWidget from '@/components/ShootAssignmentWidget';
import ShootList from '@/components/ShootList';

export const dynamic = 'force-dynamic';

export default async function ShootsPage() {
    const shoots = await getAllShoots();
    const teamMembers = await getTeamMembers();
    const allAssignments = await getAllShootAssignments();

    return (
        <main className="min-h-screen p-4 md:p-8 pt-20 md:pt-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-[var(--border-subtle)] pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
                        <Video className="w-6 h-6 text-violet-400" />
                        Shoots & Post-Production
                    </h1>
                    <p className="text-[var(--text-tertiary)] text-sm">Manage your production schedule and post-production workflows.</p>
                </div>
                <Link href="/" className="pro-button-primary flex items-center gap-2 text-sm shadow-lg shadow-violet-500/20">
                    <span className="text-lg leading-none">+</span> Schedule Shoot
                </Link>
            </header>

            {shoots.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)]/50">
                    <Video className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-white mb-2">No Shoots Scheduled</h3>
                    <p className="text-[var(--text-tertiary)] text-sm mb-6">Schedule your first shoot to get started.</p>
                    <Link href="/" className="px-4 py-2 bg-[var(--bg-surface-hover)] hover:bg-[var(--border-subtle)] rounded text-sm text-white transition-colors">
                        Go to Dashboard
                    </Link>
                </div>
            ) : (
                <ShootList shoots={shoots} teamMembers={teamMembers} allAssignments={allAssignments} />
            )}
        </main>
    );
}
