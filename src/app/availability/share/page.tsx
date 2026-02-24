import { getAvailabilitySlots } from '@/app/actions';
import PublicCalendar from '@/components/availability/PublicCalendar';

export const dynamic = 'force-dynamic';

/**
 * Fully public availability page — no login required.
 * Shows only the availability that the admin has manually set.
 */
export default async function PublicAvailabilityPage() {
    const { slots, shoots } = await getAvailabilitySlots();

    // Available = slots that are NOT booked (manually set open time)
    const availableBlocks: { date: string; startHour: number; endHour: number }[] = [];
    // Busy = booked slots + confirmed shoots
    const busyBlocks: { date: string; startHour: number; endHour: number }[] = [];

    for (const slot of slots) {
        const start = new Date(slot.start_time);
        const end = new Date(slot.end_time);
        const dateKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
        const block = { date: dateKey, startHour: start.getHours(), endHour: end.getHours() || 24 };

        if (slot.is_booked) {
            busyBlocks.push(block);
        } else {
            availableBlocks.push(block);
        }
    }

    for (const shoot of shoots) {
        const startHour = shoot.start_time ? parseInt(shoot.start_time.split(':')[0]) : 9;
        const endHour = shoot.end_time ? parseInt(shoot.end_time.split(':')[0]) : startHour + 2;
        busyBlocks.push({ date: shoot.shoot_date, startHour, endHour });
    }

    return <PublicCalendar availableBlocks={availableBlocks} busyBlocks={busyBlocks} />;
}
