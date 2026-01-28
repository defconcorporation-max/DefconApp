import { getTeamMembers } from '@/app/actions';
import { getTeamSchedule } from '@/app/team-actions';
import Link from 'next/link';
import { UserPlus, Users, Phone, Mail, LayoutGrid, Calendar as CalendarIcon } from 'lucide-react';
import { TeamMember } from '@/types';
import { addTeamMember } from '@/app/actions'; // Re-importing explicit action for form
import TeamCalendar from '@/components/team/TeamCalendar';
import TeamView from '@/components/team/TeamView';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
    const members = await getTeamMembers();
    const schedule = await getTeamSchedule();

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <header className="mb-8 border-b border-[var(--border-subtle)] pb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Team Management</h1>
                    <p className="text-[var(--text-secondary)] text-sm">Manage your team, availability, and roles.</p>
                </div>
                <Link href="/" className="text-sm font-mono text-[var(--text-tertiary)] hover:text-white transition-colors">
                    ← BACK TO DASHBOARD
                </Link>
            </header>

            <TeamView members={members} schedule={schedule} />
        </main>
    );
}
