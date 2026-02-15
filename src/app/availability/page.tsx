import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AvailabilityCalendar from '@/components/availability/AvailabilityCalendar';
import { getAvailabilitySlots, getAvailabilityRequests } from '@/app/actions';

export default async function AvailabilityPage() {
    const session = await auth();
    if (!session) redirect('/login');

    const userRole = session.user.role;
    const isAgency = userRole === 'AgencyAdmin' || userRole === 'AgencyTeam';
    const isAdmin = userRole === 'Admin' || userRole === 'Team';

    // Fetch data
    const { slots, shoots } = await getAvailabilitySlots();
    const requests = await getAvailabilityRequests(isAdmin ? undefined : session.user.agency_id);

    return (
        <main className="min-h-screen bg-[var(--bg-root)] p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-medium text-white tracking-tight">Availability & Booking</h1>
                <p className="text-[var(--text-secondary)]">Manage studio time and creative sessions.</p>
            </header>

            <AvailabilityCalendar
                initialSlots={slots}
                initialShoots={shoots}
                initialRequests={requests}
                userRole={userRole}
                agencyId={session.user.agency_id}
            />
        </main>
    );
}
