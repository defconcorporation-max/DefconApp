'use client';

import { useState } from 'react';
import { AvailabilitySlot, AvailabilityRequest } from '@/types';
import { deleteAvailabilitySlot, requestAvailabilitySlot, updateAvailabilityRequest } from '@/app/actions';
import { format, startOfWeek, addDays, isSameDay, getHours, getMinutes, isToday, addMinutes } from 'date-fns';
import { Trash, Check, X, Clock, Plus, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import CalendarHeader from './CalendarHeader';
import SlotModal from './SlotModal';

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AvailabilityCalendarProps {
    initialSlots: AvailabilitySlot[];
    initialRequests: AvailabilityRequest[];
    userRole: string;
    agencyId?: number;
}

export default function AvailabilityCalendar({ initialSlots, initialRequests, userRole, agencyId }: AvailabilityCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'week' | 'day'>('week');
    const [slots, setSlots] = useState(initialSlots);
    const [requests, setRequests] = useState(initialRequests);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined); // HH:mm

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

    const handleGridClick = (day: Date, hour: number) => {
        if (!isAdmin) return;
        setSelectedDate(day);
        setSelectedTime(`${hour.toString().padStart(2, '0')}:00`);
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
                            const daySlots = slots.filter(s => s.start_time.startsWith(dateStr));

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

                                    {/* Slots */}
                                    {daySlots.map(slot => {
                                        const slotRequests = requests.filter(r => r.slot_id === slot.id);
                                        const selfRequest = slotRequests.find(r => r.agency_id === agencyId);
                                        const approvedRequest = slotRequests.find(r => r.status === 'Approved');

                                        // Visibility Logic:
                                        // Admin: Sees ALL
                                        // Agency: Sees Available, Pending (Self), Booked (Self). Could revert to specific logic.
                                        // Let's hide unrelated bookings or show as "Booked"? Usually showing "Booked" is better UX to avoid "why can't I book here?".

                                        // Determine Color/State
                                        let statusColor = "bg-[#1A1A1A] border-[var(--border-subtle)] text-[var(--text-secondary)]"; // Default
                                        let statusLabel = ""; // No label by default
                                        let opacity = "opacity-100";

                                        if (approvedRequest) {
                                            statusColor = "bg-red-500/10 border-red-500/30 text-red-200";
                                            if (approvedRequest.agency_id === agencyId) {
                                                statusLabel = "Booked (You)";
                                            } else {
                                                statusLabel = isAdmin ? `Booked: ${approvedRequest.agency_name}` : "Booked";
                                                if (!isAdmin) opacity = "opacity-50 pointer-events-none"; // Dim other bookings
                                            }
                                        } else if (selfRequest) {
                                            if (selfRequest.status === 'Pending') {
                                                statusColor = "bg-amber-500/10 border-amber-500/30 text-amber-200";
                                                statusLabel = "Requested";
                                            } else if (selfRequest.status === 'Rejected') {
                                                statusColor = "bg-red-900/20 border-red-500/30 text-red-400";
                                                statusLabel = "Rejected";
                                            }
                                        } else {
                                            // Available
                                            statusColor = "bg-emerald-500/10 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20";
                                            statusLabel = "Open Slot";
                                        }

                                        return (
                                            <div
                                                key={slot.id}
                                                className={cn(
                                                    "absolute left-1 right-1 rounded-md border p-1.5 text-xs transition-all cursor-pointer group/slot shadow-sm overflow-hidden",
                                                    statusColor,
                                                    opacity,
                                                    "hover:z-10 hover:shadow-md"
                                                )}
                                                style={getSlotStyle(slot.start_time, slot.end_time)}
                                            >
                                                {/* Time Label */}
                                                <div className="font-mono font-bold text-[10px] opacity-70 mb-0.5">
                                                    {slot.start_time.split(' ')[1].slice(0, 5)} - {slot.end_time.split(' ')[1].slice(0, 5)}
                                                </div>

                                                <div className="font-semibold truncate leading-tight select-none">
                                                    {statusLabel}
                                                </div>

                                                {/* Hover Actions */}
                                                <div className="absolute top-1 right-1 opacity-0 group-hover/slot:opacity-100 transition-opacity flex gap-1">
                                                    {isAdmin && !approvedRequest && (
                                                        <form action={deleteAvailabilitySlot}>
                                                            <input type="hidden" name="id" value={slot.id} />
                                                            <button title="Delete Slot" className="bg-black/50 hover:bg-red-500 p-1 rounded text-white backdrop-blur-sm"><Trash size={10} /></button>
                                                        </form>
                                                    )}

                                                    {/* Agency Request Action */}
                                                    {isAgency && !selfRequest && !approvedRequest && (
                                                        <form action={requestAvailabilitySlot} onSubmit={(e) => {
                                                            // e.preventDefault(); // Let it submit naturally
                                                        }}>
                                                            <input type="hidden" name="slotId" value={slot.id} />
                                                            <input type="hidden" name="agencyId" value={agencyId} />
                                                            <button title="Request" className="bg-violet-600 hover:bg-violet-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
                                                                Book
                                                            </button>
                                                        </form>
                                                    )}
                                                </div>

                                                {/* Admin Request Approvals (Inside Slot?) or Popover? Inside for now if space permits */}
                                                {isAdmin && slotRequests.length > 0 && (
                                                    <div className="mt-1 pt-1 border-t border-white/10 space-y-1">
                                                        {slotRequests.map(req => (
                                                            <div key={req.id} className="flex justify-between items-center text-[9px] bg-black/20 rounded px-1 py-0.5">
                                                                <span className="truncate max-w-[60px]">{req.agency_name}</span>
                                                                {req.status === 'Pending' && (
                                                                    <div className="flex gap-0.5">
                                                                        <form action={updateAvailabilityRequest}>
                                                                            <input type="hidden" name="id" value={req.id} />
                                                                            <input type="hidden" name="status" value="Approved" />
                                                                            <input type="hidden" name="slotId" value={slot.id} />
                                                                            <button className="text-emerald-400 hover:text-emerald-300"><Check size={10} /></button>
                                                                        </form>
                                                                        <form action={updateAvailabilityRequest}>
                                                                            <input type="hidden" name="id" value={req.id} />
                                                                            <input type="hidden" name="status" value="Rejected" />
                                                                            <input type="hidden" name="slotId" value={slot.id} />
                                                                            <button className="text-red-400 hover:text-red-300"><X size={10} /></button>
                                                                        </form>
                                                                    </div>
                                                                )}
                                                                {req.status === 'Approved' && <Check size={8} className="text-emerald-400" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Admin Add Slot Modal */}
            <SlotModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialDate={selectedDate}
                initialStartTime={selectedTime}
            />
        </div>
    );
}

