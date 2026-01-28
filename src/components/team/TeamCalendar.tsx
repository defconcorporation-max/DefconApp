'use client';

import { useState } from 'react';
import { ShootAssignment } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    schedule: ShootAssignment[];
}

export default function TeamCalendar({ schedule }: Props) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Group by date
    const eventsByDate = schedule.reduce((acc, event) => {
        const dateStr = event.shoot_date || ''; // YYYY-MM-DD
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(event);
        return acc;
    }, {} as Record<string, ShootAssignment[]>);

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[#111]">
                <h2 className="font-bold text-lg">{format(currentDate, 'MMMM yyyy')}</h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded"><ChevronLeft size={20} /></button>
                    <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-[var(--border-subtle)]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-xs text-[var(--text-tertiary)] uppercase font-bold border-r border-[var(--border-subtle)] last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr">
                {/* Simplified: Just days of current month. 
                    Real calendar usually pads prev/next month days to fill grid. 
                    For MVP, keeping simple list or just current month days. 
                */}
                {days.map((day, idx) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDate[dateKey] || [];
                    const isCurrent = isToday(day);

                    return (
                        <div key={day.toString()} className={`min-h-[100px] border-r border-b border-[var(--border-subtle)] p-2 relative ${idx % 7 === 6 ? 'border-r-0' : ''}`}>
                            <span className={`text-xs font-medium mb-1 block ${isCurrent ? 'text-indigo-400' : 'text-[var(--text-tertiary)]'}`}>
                                {format(day, 'd')}
                            </span>

                            <div className="space-y-1">
                                {dayEvents.map(event => (
                                    <div key={event.id} className="text-[10px] bg-[#151515] hover:bg-[#222] border border-[var(--border-subtle)] rounded p-1 transition-colors cursor-default group relative">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full bg-${event.member_avatar_color}-500`} />
                                            <span className="truncate flex-1 font-medium">{event.member_name}</span>
                                        </div>
                                        <div className="opacity-70 truncate px-0.5">{event.shoot_title}</div>

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-0 w-max max-w-[200px] bg-black border border-[var(--border-subtle)] p-2 rounded text-xs z-10 hidden group-hover:block mb-1 shadow-xl">
                                            <p className="font-bold text-white">{event.shoot_title}</p>
                                            <p className="text-[var(--text-secondary)]">{event.member_name} as {event.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
