import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AvailabilityCalendar from '@/components/availability/AvailabilityCalendar';
import { getAvailabilitySlots, getAvailabilityRequests, getClientsForBooking } from '@/app/actions';
import Link from 'next/link';
import { Share2 } from 'lucide-react';

export default async function AvailabilityPage() {
    const session = await auth();
    if (!session) redirect('/login');

    const userRole = session.user.role;
    const isAgency = userRole === 'AgencyAdmin' || userRole === 'AgencyTeam';
    const isAdmin = userRole === 'Admin' || userRole === 'Team';

    // Fetch data
    const { slots, shoots } = await getAvailabilitySlots();
    const requests = await getAvailabilityRequests(isAdmin ? undefined : session.user.agency_id);
    const clients = await getClientsForBooking(isAgency ? session.user.agency_id : undefined);

    return (
        <main className="min-h-screen bg-[var(--bg-root)] p-8">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-medium text-white tracking-tight">Availability &amp; Booking</h1>
                    <p className="text-[var(--text-secondary)]">Manage studio time and creative sessions.</p>
                </div>
                <Link
                    href="/availability/share"
                    target="_blank"
                    className="px-4 py-2 text-sm border border-[var(--border-subtle)] rounded-full hover:bg-white/5 transition-colors flex items-center gap-2 text-[var(--text-secondary)]"
                >
                    <Share2 size={16} /> Share Availability
                </Link>
            </header>

            <AvailabilityCalendar
                initialSlots={slots}
                initialShoots={shoots}
                initialRequests={requests}
                userRole={userRole}
                agencyId={session.user.agency_id}
                clients={clients}
            />
        </main>
    );
}
