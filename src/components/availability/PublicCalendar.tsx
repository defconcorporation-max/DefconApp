'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import PublicBookingModal from './PublicBookingModal';
import { Toaster, toast } from 'react-hot-toast';

interface TimeBlock {
    date: string; // YYYY-MM-DD
    startHour: number;
    endHour: number;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM - 7PM (ends at 8PM)

function buildHourMap(blocks: TimeBlock[]) {
    const map = new Map<string, Set<number>>();
    for (const b of blocks) {
        if (!map.has(b.date)) map.set(b.date, new Set());
        for (let h = b.startHour; h < b.endHour; h++) {
            map.get(b.date)!.add(h);
        }
    }
    return map;
}

function toDateKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function PublicCalendar({ busyBlocks }: { busyBlocks: TimeBlock[] }) {
    const now = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
    const [view, setView] = useState<'month' | 'week'>('month');
    const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);

    // Modal state
    const [bookingSlot, setBookingSlot] = useState<{ date: Date, startHour: number } | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Map: date → set of busy hours
    const busyMap = buildHourMap(busyBlocks);

    // Navigation
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => {
        setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setSelectedWeekStart(null);
        setView('month');
    };

    const prevWeek = () => {
        if (selectedWeekStart) {
            const d = new Date(selectedWeekStart);
            d.setDate(d.getDate() - 7);
            setSelectedWeekStart(d);
            setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
        }
    };
    const nextWeek = () => {
        if (selectedWeekStart) {
            const d = new Date(selectedWeekStart);
            d.setDate(d.getDate() + 7);
            setSelectedWeekStart(d);
            setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
        }
    };

    // ── Month View ──
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday=0
    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

    const getDayStatus = (day: number) => {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const date = new Date(year, month, day);

        // Treat as past. If today, check if the entire working day is past 8PM.
        const isPast = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const busyHours = busyMap.get(dateKey)?.size || 0;

        if (isPast) return 'past';
        if (busyHours >= HOURS.length) return 'full';   // Completely booked
        if (busyHours > 0) return 'partial';            // Mix of available & booked
        return 'free'; // Fully available
    };

    const handleDayClick = (day: number) => {
        const date = new Date(year, month, day);
        const dayOfWeek = (date.getDay() + 6) % 7;
        const monday = new Date(date);
        monday.setDate(date.getDate() - dayOfWeek);
        setSelectedWeekStart(monday);
        setView('week');
    };

    // ── Week View ──
    const weekDays: Date[] = [];
    if (selectedWeekStart) {
        for (let i = 0; i < 7; i++) {
            const d = new Date(selectedWeekStart);
            d.setDate(selectedWeekStart.getDate() + i);
            weekDays.push(d);
        }
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            <header className="bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm">D</div>
                    <div>
                        <span className="font-bold tracking-wider text-sm">DEFCON VISUAL</span>
                        <span className="text-xs text-gray-500 ml-2">Studio Availability</span>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Studio Availability</h1>
                    <p className="text-gray-400 text-sm">Click any day to see the hourly breakdown.</p>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <button onClick={view === 'week' ? prevWeek : prevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-lg font-bold min-w-[200px] text-center">
                            {view === 'week' && selectedWeekStart
                                ? `${selectedWeekStart.getDate()} ${MONTH_NAMES[selectedWeekStart.getMonth()].slice(0, 3)} – ${weekDays[6]?.getDate()} ${MONTH_NAMES[weekDays[6]?.getMonth()].slice(0, 3)} ${weekDays[6]?.getFullYear()}`
                                : `${MONTH_NAMES[month]} ${year}`
                            }
                        </h2>
                        <button onClick={view === 'week' ? nextWeek : nextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={goToday} className="px-3 py-1.5 text-xs border border-white/10 rounded-full hover:bg-white/5 transition-colors">
                            Today
                        </button>
                        {view === 'week' && (
                            <button onClick={() => setView('month')} className="px-3 py-1.5 text-xs border border-white/10 rounded-full hover:bg-white/5 transition-colors flex items-center gap-1">
                                <Calendar size={12} /> Month
                            </button>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-green-500/30 border border-green-500/40" />
                        <span className="text-gray-400">Available</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-yellow-500/30 border border-yellow-500/40" />
                        <span className="text-gray-400">Partially Booked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/40" />
                        <span className="text-gray-400">Booked</span>
                    </div>
                </div>

                {/* ──── Month View ──── */}
                {view === 'month' && (
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-7 border-b border-white/10">
                            {DAY_NAMES.map(d => (
                                <div key={d} className="text-center py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {calendarDays.map((day, i) => {
                                if (day === null) return <div key={i} className="h-20 border-b border-r border-white/5" />;

                                const status = getDayStatus(day);
                                const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const busyHours = busyMap.get(dateKey)?.size || 0;
                                const availHours = HOURS.length - busyHours;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => status !== 'past' && handleDayClick(day)}
                                        disabled={status === 'past'}
                                        className={`h-20 border-b border-r border-white/5 p-2 text-left transition-colors relative ${status === 'past' ? 'opacity-30 cursor-default' :
                                            'cursor-pointer hover:bg-white/[0.08]'
                                            }`}
                                    >
                                        <span className={`text-sm font-medium inline-flex items-center justify-center ${isToday ? 'w-7 h-7 rounded-full bg-indigo-600 text-white' :
                                            status === 'past' ? 'text-gray-600' : 'text-white'
                                            }`}>
                                            {day}
                                        </span>
                                        {status !== 'past' && (
                                            <div className="absolute bottom-2 left-2 right-2">
                                                <div className={`h-1.5 rounded-full ${status === 'full' ? 'bg-red-500/60' :
                                                    status === 'partial' ? 'bg-yellow-500/60' :
                                                        'bg-green-500/50'
                                                    }`} />
                                            </div>
                                        )}
                                        {status !== 'past' && availHours > 0 && (
                                            <div className="absolute top-2 right-2 text-[9px] text-green-400/70 font-mono">
                                                {availHours}h
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ──── Week View (hourly detail) ──── */}
                {view === 'week' && selectedWeekStart && (
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
                        <div className="min-w-[600px]">
                            {/* Week header */}
                            <div className="grid gap-0" style={{ gridTemplateColumns: '50px repeat(7, 1fr)' }}>
                                <div className="border-b border-r border-white/10 p-2" />
                                {weekDays.map((day, i) => {
                                    const isToday = day.toDateString() === now.toDateString();
                                    return (
                                        <div key={i} className={`text-center py-3 border-b border-white/10 ${isToday ? 'bg-indigo-500/10' : ''}`}>
                                            <div className="text-xs font-bold uppercase text-gray-400">
                                                {DAY_NAMES[(day.getDay() + 6) % 7]}
                                            </div>
                                            <div className={`text-lg font-bold ${isToday ? 'text-indigo-400' : 'text-white'}`}>
                                                {day.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Hourly grid */}
                            {HOURS.map(hour => (
                                <div key={hour} className="grid gap-0" style={{ gridTemplateColumns: '50px repeat(7, 1fr)' }}>
                                    <div className="text-right pr-2 text-[10px] text-gray-600 font-mono py-2 border-r border-white/5">
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                    {weekDays.map((day, di) => {
                                        const dateKey = toDateKey(day);
                                        const isBusy = busyMap.has(dateKey) && busyMap.get(dateKey)!.has(hour);
                                        const isPast = day < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                        const isPastHour = day.toDateString() === now.toDateString() && hour < now.getHours();

                                        let cellClass = 'h-10 w-full border-b border-r border-white/5 transition-colors focus:outline-none ';
                                        if (isPast || isPastHour) {
                                            cellClass += 'bg-white/[0.02] cursor-default'; // Past
                                        } else if (isBusy) {
                                            cellClass += 'bg-red-500/15 cursor-default'; // Booked
                                        } else {
                                            cellClass += 'bg-green-500/15 cursor-pointer hover:bg-green-500/30'; // Default Available
                                        }

                                        return (
                                            <button
                                                key={di}
                                                disabled={isPast || isPastHour || !!isBusy}
                                                onClick={() => setBookingSlot({ date: day, startHour: hour })}
                                                className={cellClass}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Booking Modal */}
            {bookingSlot && (
                <PublicBookingModal
                    date={bookingSlot.date}
                    startHour={bookingSlot.startHour}
                    onClose={() => setBookingSlot(null)}
                    onSuccess={() => {
                        setBookingSlot(null);
                        toast.success('Booking request submitted! We will contact you shortly.', { style: { background: '#333', color: '#fff' } });
                    }}
                />
            )}
            <Toaster position="bottom-right" />
        </main>
    );
}
