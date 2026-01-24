
'use client';

import { useState, useMemo } from 'react';
import { setMemberAvailability } from '@/app/actions';
import { ChevronLeft, ChevronRight, Check, X, Clock } from 'lucide-react';

interface AvailabilityCalendarProps {
    memberId: number;
    availability: any[];
}

export default function AvailabilityCalendar({ memberId, availability }: AvailabilityCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return new Date(year, month + 1, 0).getDate();
    }, [currentDate]);

    const firstDayOfMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return new Date(year, month, 1).getDay();
    }, [currentDate]);

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const getStatusForDate = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return availability.find(a => a.date === dateStr);
    };

    const handleDateClick = async (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = getStatusForDate(day);

        // Cycle: Available -> Booked -> Off -> Available
        let newStatus = 'Booked';
        let note = '';

        if (record?.status === 'Booked') {
            newStatus = 'Off';
        } else if (record?.status === 'Off') {
            newStatus = 'Available';
        }

        // Optimistic UI update (requires a proper re-fetch or state update but here we rely on server action revalidation)
        // For smoother UX, ideally we update local state too, but let's stick to simple action call first.
        await setMemberAvailability(memberId, dateStr, newStatus, note);
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg capitalize">{monthName}</h3>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-[var(--text-tertiary)] mb-2">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const record = getStatusForDate(day);
                    const status = record?.status || 'Available';

                    let bgClass = 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)]';
                    let Icon = null;

                    if (status === 'Booked') {
                        bgClass = 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
                        Icon = Clock;
                    } else if (status === 'Off') {
                        bgClass = 'bg-red-500/20 text-red-400 border border-red-500/30';
                        Icon = X;
                    }

                    return (
                        <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${bgClass}`}
                        >
                            <span className="font-bold">{day}</span>
                            {Icon && <Icon size={14} />}
                            {status !== 'Available' && <span className="text-[10px] uppercase font-bold tracking-wider">{status}</span>}
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-6 mt-6 justify-center text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white/5 rounded-full"></div> Available</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500/20 border border-indigo-500/30 rounded-full"></div> Booked</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500/20 border border-red-500/30 rounded-full"></div> Time Off</div>
            </div>
        </div>
    );
}
