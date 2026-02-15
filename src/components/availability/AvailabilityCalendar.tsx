'use client';

import { useState } from 'react';
import { AvailabilitySlot, AvailabilityRequest } from '@/types';
import { deleteAvailabilitySlot, requestAvailabilitySlot, updateAvailabilityRequest, createAvailabilitySlot, toggleShootBlocking } from '@/app/actions';
import { format, startOfWeek, addDays, isSameDay, getHours, getMinutes, isToday, addMinutes } from 'date-fns';
import { Trash, Check, X, Clock, Plus, User, Calendar as CalendarIcon, Video } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import CalendarHeader from './CalendarHeader';
import SlotModal from './SlotModal';

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AvailabilityCalendarProps {
    initialSlots: AvailabilitySlot[]; // NOW 'BLOCKS'
    initialShoots: any[];
    initialRequests: AvailabilityRequest[];
    userRole: string;
    agencyId?: number;
}

export default function AvailabilityCalendar({ initialSlots, initialShoots, initialRequests, userRole, agencyId }: AvailabilityCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'week' | 'day'>('week');
    const [slots, setSlots] = useState(initialSlots);
    const [shoots, setShoots] = useState(initialShoots);
    const [requests, setRequests] = useState(initialRequests);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined); // HH:mm

    // Shoot Details Popover (Simple implementation)
    const [selectedShoot, setSelectedShoot] = useState<any | null>(null);

    // Admin Controls
    const isAdmin = userRole === 'Admin' || userRole === 'Team';
    const isAgency = userRole === 'AgencyAdmin' || userRole === 'AgencyTeam';

    // Calendar Constants
    const START_HOUR = 8; // 8 AM
    const END_HOUR = 20; // 8 PM
    const TOTAL_HOURS = END_HOUR - START_HOUR;
    const HOUR_HEIGHT = 60; // px

    // Grid Generation
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

    // Helper: Position logic
    const getSlotStyle = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        const startH = getHours(startDate);
        const startM = getMinutes(startDate);
        const endH = getHours(endDate);
        const endM = getMinutes(endDate);

        // Calculate offset from START_HOUR in minutes
        const startOffsetMinutes = (startH - START_HOUR) * 60 + startM;
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

        return {
            top: `${(startOffsetMinutes / 60) * HOUR_HEIGHT}px`,
            height: `${(durationMinutes / 60) * HOUR_HEIGHT}px`,
        };
    };

    // Edit State
    const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | undefined>(undefined);

    const handleGridClick = (day: Date, hour: number) => {
        if (!isAdmin) return;
        setEditingSlot(undefined); // Clear edit state
        setSelectedDate(day);
        setSelectedTime(`${hour.toString().padStart(2, '0')}:00`);
        setIsModalOpen(true);
    };

    const handleBlockClick = (slot: AvailabilitySlot) => {
        if (!isAdmin) return;
        setEditingSlot(slot);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] select-none">
            <CalendarHeader
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                isAdmin={isAdmin}
                view={view}
                onViewChange={setView}
            />

            {/* Calendar Container */}
            <div className="flex-1 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden flex flex-col relative">

                {/* Header Row (Days) */}
                <div className="grid grid-cols-8 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] z-10 sticky top-0">
                    <div className="p-4 border-r border-[var(--border-subtle)] text-xs font-mono text-[var(--text-tertiary)] flex items-center justify-center">
                        UTC-5
                    </div>
                    {weekDays.map(day => (
                        <div key={day.toString()} className={cn(
                            "p-3 text-center border-r border-[var(--border-subtle)] last:border-r-0 transition-colors",
                            isToday(day) ? "bg-violet-500/5" : ""
                        )}>
                            <div className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] mb-1">{format(day, 'EEE')}</div>
                            <div className={cn(
                                "text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto",
                                isToday(day) ? "bg-violet-600 text-white" : "text-[var(--text-secondary)]"
                            )}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Scrollable Time Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    <div className="grid grid-cols-8 min-h-max" style={{ height: (TOTAL_HOURS * HOUR_HEIGHT) + 'px' }}>

                        {/* Time Axis */}
                        <div className="border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky left-0 z-10">
                            {hours.map(hour => (
                                <div key={hour} className="relative border-b border-[var(--border-subtle)]" style={{ height: `${HOUR_HEIGHT}px` }}>
                                    <span className="absolute -top-2.5 right-2 text-[10px] sm:text-xs font-mono text-[var(--text-tertiary)] font-medium">
                                        {format(new Date().setHours(hour, 0), 'ha')}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Days Columns */}
                        {weekDays.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');

                            // 1. Availability Blocks (Manually created unavailabilities)
                            const dayBlocks = slots.filter(s => s.start_time.startsWith(dateStr));

                            // 2. Shoots (Visual Events)
                            const dayShoots = shoots.filter(s => s.shoot_date.startsWith(dateStr));

                            return (
                                <div key={day.toString()} className="relative border-r border-[var(--border-subtle)] last:border-r-0 group/col hover:bg-white/[0.02] transition-colors">
                                    {/* Hour Grid Lines */}
                                    {hours.map(hour => (
                                        <div
                                            key={`${day}-${hour}`}
                                            onClick={() => handleGridClick(day, hour)}
                                            className="border-b border-[var(--border-subtle)] w-full cursor-pointer hover:bg-white/5 transition-colors absolute w-full"
                                            style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                                        />
                                    ))}

                                    {/* SHOOTS LAYER */}
                                    {dayShoots.map(shoot => {
                                        // Agency Visibility: 
                                        // - Owner: Visible as "My Shoot"
                                        // - Others: Only visible if filtered? User said: "agency should see info for their shoot and just ''unavailable'' for the shoot unrelated to them"
                                        // BUT "shoots should not mark unavailable right away"
                                        // So: 
                                        // If Admin: See Shoot.
                                        // If Agency & Own: See Shoot.
                                        // If Agency & Other: Do NOT see (unless blocked manually).

                                        if (isAgency && shoot.agency_id !== agencyId) return null;

                                        // Default duration 8h if not specified (or calculated from start time)
                                        // For visual, let's assume 9am-5pm if strict date, or parse time.
                                        // DB `shoots` has `shoot_date` datetime? Assuming yes from previous steps.
                                        // Let's rely on standard day positioning for now.
                                        // Hack: Just put it at 9am-5pm for visual unless we have specific time data
                                        // Time Parsing Logic
                                        let startTime = `${shoot.shoot_date} 09:00:00`;
                                        let endTime = addMinutes(new Date(startTime), 480).toISOString(); // Default 9-5

                                        // If shoot has explicit start/end times (HH:mm or HH:mm:ss)
                                        if (shoot.start_time && shoot.end_time) {
                                            const datePart = shoot.shoot_date.split(' ')[0]; // Ensure YYYY-MM-DD
                                            startTime = `${datePart} ${shoot.start_time}`;
                                            endTime = `${datePart} ${shoot.end_time}`;
                                        } else if (shoot.shoot_date.includes(' ')) {
                                            // Fallback if shoot_date is datetime
                                            startTime = shoot.shoot_date;
                                            endTime = addMinutes(new Date(startTime), 120).toISOString(); // Default 2h if datetime but no end_time
                                        }

                                        // Linked Block Mode
                                        const isBlocking = shoot.is_blocking === 1;

                                        // Style classes
                                        const baseClasses = "absolute left-1.5 right-1.5 rounded-md border p-1.5 text-xs transition-all shadow-sm";
                                        const eventClasses = "bg-indigo-500/20 border-indigo-500/40 text-indigo-200 hover:z-20 hover:bg-indigo-500/30";
                                        const blockClasses = "bg-red-500/20 border-red-500/40 text-red-200 z-20 hover:z-30 hover:bg-red-500/30 striped-bg";
                                        const classes = isBlocking ? blockClasses : eventClasses;

                                        const cursorClass = isAdmin ? "cursor-pointer hover:border-opacity-100" : "cursor-default";

                                        return (
                                            <div
                                                key={`shoot-${shoot.id}`}
                                                onClick={(e) => {
                                                    if (isAdmin) {
                                                        e.stopPropagation();
                                                        toggleShootBlocking(shoot.id, !isBlocking);
                                                    }
                                                }}
                                                className={cn(baseClasses, classes, cursorClass)}
                                                style={getSlotStyle(startTime, endTime)}
                                                title={isAdmin ? (isBlocking ? "Click to verify available" : "Click to mark unavailable") : shoot.project_title}
                                            >
                                                <div className="flex items-center gap-1 font-mono font-bold text-[10px] opacity-70 mb-0.5">
                                                    {isBlocking ? <X size={10} /> : <Video size={10} />}
                                                    {isBlocking ? "Blocked Shoot" : "Shoot"}
                                                    {isAdmin && (
                                                        <div className="ml-auto bg-black/40 text-white rounded p-0.5 opacity-0 group-hover:opacity-100">
                                                            {isBlocking ? <Check size={8} /> : <X size={8} />}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="font-semibold truncate leading-tight">
                                                    {shoot.project_title}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* BLOCKS LAYER (Top Z-Index - "Unavailable") */}
                                    {dayBlocks.map(slot => {
                                        // These are explicit "Unavailabilities"
                                        // Agency sees: "Unavailable"
                                        // Admin sees: "Unavailable" (and can delete)

                                        // Check if this block corresponds to a generic "Unavailable" or a specific "Booking" (if we keep requests)
                                        // For now, treat all `slots` as Blocks.

                                        return (
                                            <div
                                                key={slot.id}
                                                onClick={(e) => {
                                                    // Only trigger edit if not clicking delete
                                                    // e.stopPropagation(); (Wait, delete button stops prop, so we don't need to check target here ideally)
                                                    // But to be safe:
                                                    handleBlockClick(slot);
                                                }}
                                                className="absolute left-1 right-1 rounded-md border p-1.5 text-xs transition-all cursor-pointer group/slot shadow-sm overflow-hidden bg-zinc-800/80 border-zinc-600 text-zinc-400 z-30 striped-bg"
                                                style={getSlotStyle(slot.start_time, slot.end_time)}
                                                title="Click to Edit"
                                            >
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <span className="font-mono font-bold text-[10px] opacity-70">
                                                        {slot.start_time.split(' ')[1].slice(0, 5)} - {slot.end_time.split(' ')[1].slice(0, 5)}
                                                    </span>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (confirm('Are you sure you want to remove this unavailability block?')) {
                                                                    try {
                                                                        console.log('Deleting slot:', slot.id);
                                                                        await deleteAvailabilitySlot(slot.id);
                                                                    } catch (err) {
                                                                        console.error('Delete failed:', err);
                                                                        alert('Failed to delete availability block. Check console.');
                                                                    }
                                                                }
                                                            }}
                                                            title="Remove Block"
                                                            className="text-zinc-400 hover:text-red-400 bg-black/60 hover:bg-black/80 rounded p-1 transition-colors ml-auto z-50 relative pointer-events-auto"
                                                        >
                                                            <Trash size={12} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                                                    <X size={10} /> Unavailable
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Admin Add Unavailability Modal */}
            <SlotModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialDate={selectedDate}
                initialStartTime={selectedTime}
                initialSlot={editingSlot}
                mode={editingSlot ? 'edit' : 'block'}
            />
        </div>
    );
}
