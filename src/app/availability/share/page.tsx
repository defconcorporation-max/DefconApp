import { getAvailabilitySlots } from '@/app/actions';

export const dynamic = 'force-dynamic';

/**
 * Public availability page — shareable with clients.
 * Shows a read-only weekly view of available and booked time slots.
 * No private details (client names, project names) are shown.
 */
export default async function PublicAvailabilityPage() {
    const { slots, shoots } = await getAvailabilitySlots();

    // Build a map of days → time blocks (available / busy)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday

    // Generate 14 days from today (2 weeks ahead)
    const days: Date[] = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(now.getDate() + i);
        d.setHours(0, 0, 0, 0);
        days.push(d);
    }

    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM - 7PM

    // Build busy map: date → set of busy hours
    const busyMap = new Map<string, Set<number>>();

    // Mark shoots as busy
    for (const shoot of shoots) {
        const dateKey = shoot.shoot_date;
        if (!busyMap.has(dateKey)) busyMap.set(dateKey, new Set());
        const startHour = shoot.start_time ? parseInt(shoot.start_time.split(':')[0]) : 9;
        const endHour = shoot.end_time ? parseInt(shoot.end_time.split(':')[0]) : startHour + 2;
        for (let h = startHour; h < endHour; h++) {
            busyMap.get(dateKey)!.add(h);
        }
    }

    // Mark booked availability slots as busy
    for (const slot of slots) {
        if (slot.is_booked) {
            const date = new Date(slot.start_time);
            const dateKey = date.toISOString().split('T')[0];
            if (!busyMap.has(dateKey)) busyMap.set(dateKey, new Set());
            const startHour = date.getHours();
            const endDate = new Date(slot.end_time);
            const endHour = endDate.getHours();
            for (let h = startHour; h < endHour; h++) {
                busyMap.get(dateKey)!.add(h);
            }
        }
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            {/* Header */}
            <header className="bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm">D</div>
                <div>
                    <span className="font-bold tracking-wider text-sm">DEFCON VISUAL</span>
                    <span className="text-xs text-gray-500 ml-2">Studio Availability</span>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Studio Availability</h1>
                    <p className="text-gray-400">View our upcoming availability for shoots and creative sessions.</p>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
                        <span className="text-gray-400">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30" />
                        <span className="text-gray-400">Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-white/5 border border-white/10" />
                        <span className="text-gray-400">Past / Unavailable</span>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                        {/* Header Row */}
                        <div className="grid gap-1" style={{ gridTemplateColumns: '60px repeat(14, 1fr)' }}>
                            <div /> {/* Empty corner */}
                            {days.map((day, i) => {
                                const isToday = day.toDateString() === now.toDateString();
                                const isPast = day < now && !isToday;
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                return (
                                    <div key={i} className={`text-center py-2 text-xs ${isToday ? 'text-indigo-400 font-bold' : isPast ? 'text-gray-600' : isWeekend ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <div>{dayNames[day.getDay()]}</div>
                                        <div className={`text-lg font-bold ${isToday ? 'w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mx-auto text-white text-sm' : ''}`}>
                                            {day.getDate()}
                                        </div>
                                        <div className="text-[10px]">{monthNames[day.getMonth()]}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Time rows */}
                        {hours.map(hour => (
                            <div key={hour} className="grid gap-1 mb-1" style={{ gridTemplateColumns: '60px repeat(14, 1fr)' }}>
                                <div className="text-right pr-2 text-[10px] text-gray-600 font-mono pt-1">
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                                {days.map((day, di) => {
                                    const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                                    const isBusy = busyMap.has(dateKey) && busyMap.get(dateKey)!.has(hour);
                                    const isPast = day < now && day.toDateString() !== now.toDateString();
                                    const isPastHour = day.toDateString() === now.toDateString() && hour < now.getHours();
                                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                                    if (isPast || isPastHour) {
                                        return <div key={di} className="h-8 rounded bg-white/[0.02] border border-white/[0.03]" />;
                                    }
                                    if (isWeekend) {
                                        return <div key={di} className="h-8 rounded bg-white/[0.03] border border-white/[0.05]" />;
                                    }
                                    if (isBusy) {
                                        return <div key={di} className="h-8 rounded bg-red-500/15 border border-red-500/20" />;
                                    }
                                    return <div key={di} className="h-8 rounded bg-green-500/10 border border-green-500/15 hover:bg-green-500/20 transition-colors" />;
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact CTA */}
                <div className="mt-12 text-center bg-white/5 border border-white/10 rounded-2xl p-8">
                    <h2 className="text-xl font-bold mb-2">Want to book a session?</h2>
                    <p className="text-gray-400 text-sm mb-4">Contact us to schedule your next shoot.</p>
                    <a href="mailto:contact@defconvisual.com" className="inline-flex px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full transition-colors shadow-lg shadow-indigo-500/20">
                        Get in Touch
                    </a>
                </div>
            </div>
        </main>
    );
}
