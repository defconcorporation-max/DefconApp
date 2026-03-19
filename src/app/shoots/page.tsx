import { getAllShoots, getTeamMembers, getAllShootAssignments } from '@/app/actions';
import Link from 'next/link';
import { Video } from 'lucide-react';
import ShootList from '@/components/ShootList';
import PageLayout from '@/components/layout/PageLayout';

export const dynamic = 'force-dynamic';

export default async function ShootsPage() {
    const shoots = await getAllShoots();
    const teamMembers = await getTeamMembers();
    const allAssignments = await getAllShootAssignments();

    return (
        <PageLayout
            breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Shoots' }]}
            title="Shoots"
            subtitle="Planning de production et post-production."
            actions={
                <Link href="/availability" className="pro-button-primary flex items-center gap-2 text-sm">
                    <span className="text-lg leading-none">+</span> Planifier un shoot
                </Link>
            }
            compact
        >
            {shoots.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)]/50 pro-card-tertiary">
                    <Video className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-white mb-2">Aucun shoot planifié</h3>
                    <p className="text-[var(--text-tertiary)] text-sm mb-6">Planifiez votre premier shoot depuis la page Disponibilités.</p>
                    <Link href="/availability" className="px-4 py-2 pro-button-primary rounded text-sm">
                        Voir les disponibilités
                    </Link>
                </div>
            ) : (
                <ShootList shoots={shoots} teamMembers={teamMembers} allAssignments={allAssignments} />
            )}
        </PageLayout>
    );
}
