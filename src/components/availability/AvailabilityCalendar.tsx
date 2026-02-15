'use client';

import { useState } from 'react';
import { AvailabilitySlot, AvailabilityRequest } from '@/types';
import { createAvailabilitySlot, deleteAvailabilitySlot, requestAvailabilitySlot, updateAvailabilityRequest } from '@/app/actions';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash, Check, X, Clock } from 'lucide-react';

interface AvailabilityCalendarProps {
    initialSlots: AvailabilitySlot[];
    initialRequests: AvailabilityRequest[];
    userRole: string;
    agencyId?: number;
}

export default function AvailabilityCalendar({ initialSlots, initialRequests, userRole, agencyId }: AvailabilityCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [slots, setSlots] = useState(initialSlots);
    const [requests, setRequests] = useState(initialRequests);

    // Admin Controls
    const isAdmin = userRole === 'Admin' || userRole === 'Team';
    const isAgency = userRole === 'AgencyAdmin' || userRole === 'AgencyTeam';

    // Calendar Grid Generation
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

    // Time Slots (9AM - 6PM for simplicity in grid view, though slots are free-form in DB)
    // Actually, displaying list of slots per day is better than a full grid if slots vary wildly.
    // Let's do a columnar week view.

    const handleCreateSlot = async (date: Date) => {
        if (!isAdmin) return;
        // Default new slot: 10:00 - 12:00
        const dateStr = format(date, 'yyyy-MM-dd');
        const start = `${dateStr} 10:00`;
        const end = `${dateStr} 12:00`;

        await createAvailabilitySlot(start, end);
        // Optimistic update or refresh? For now, refresh via server action revalidate happens, but we need to update local state logic if not using reload.
        // Simple window.location.reload() for MVP or managing state properly.
        // Let's assume server action revalidates path, so router refresh happens automatically in Next 14? 
        // We might need router.refresh() if using client component.
        // For now, simple alert or auto-refresh.
    };

    return (
        <div className="space-y-8">
            {/* Toolbar */}
            <div className="flex justify-between items-center bg-[#0A0A0A] border border-[var(--border-subtle)] p-4 rounded-xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-2 hover:bg-white/10 rounded-lg"><ChevronLeft size={20} /></button>
                    <h2 className="text-xl font-bold text-white min-w-[200px] text-center">
                        {format(startDate, 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                    </h2>
                    <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 hover:bg-white/10 rounded-lg"><ChevronRight size={20} /></button>
                </div>

                {isAdmin && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-tertiary)] uppercase font-bold">Admin Mode</span>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                )}
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-7 gap-4">
                {weekDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const daySlots = slots.filter(s => s.start_time.startsWith(dateStr));

                    return (
                        <div key={day.toString()} className="flex flex-col gap-2">
                            <div className={`p-3 rounded-lg text-center border ${isSameDay(day, new Date()) ? 'bg-violet-500/10 border-violet-500 text-violet-400' : 'bg-[#0A0A0A] border-[var(--border-subtle)] text-[var(--text-secondary)]'}`}>
                                <div className="text-xs uppercase font-bold mb-1">{format(day, 'EEE')}</div>
                                <div className="text-2xl font-bold text-white">{format(day, 'd')}</div>
                            </div>

                            <div className="space-y-2 min-h-[500px] bg-[#0A0A0A]/50 rounded-lg p-2 border border-transparent hover:border-[var(--border-subtle)] transition-colors relative group/day">
                                {/* Add Slot Button (Admin) */}
                                {isAdmin && (
                                    <button
                                        onClick={() => handleCreateSlot(day)}
                                        className="w-full py-1.5 dashed-border rounded text-[10px] text-[var(--text-tertiary)] hover:text-white hover:border-white opacity-0 group-hover/day:opacity-100 transition-all"
                                    >
                                        + Add Slot
                                    </button>
                                )}

                                {daySlots.map(slot => {
                                    const slotRequests = requests.filter(r => r.slot_id === slot.id);
                                    const selfRequest = slotRequests.find(r => r.agency_id === agencyId);
                                    const approvedRequest = slotRequests.find(r => r.status === 'Approved');

                                    return (
                                        <div key={slot.id} className={`p-3 rounded border text-sm relative group/slot ${slot.is_booked || approvedRequest ? 'bg-red-500/10 border-red-500/20' :
                                                selfRequest ? 'bg-amber-500/10 border-amber-500/20' :
                                                    'bg-[var(--bg-surface)] border-[var(--border-subtle)]'
                                            }`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-mono font-bold text-white">
                                                    {slot.start_time.split(' ')[1]} - {slot.end_time.split(' ')[1]}
                                                </span>
                                                {isAdmin && (
                                                    <form action={deleteAvailabilitySlot}>
                                                        <input type="hidden" name="id" value={slot.id} />
                                                        <button className="text-[var(--text-tertiary)] hover:text-red-400"><Trash size={12} /></button>
                                                    </form>
                                                )}
                                            </div>

                                            {/* Status / Request Button */}
                                            {approvedRequest ? (
                                                <div className="text-xs text-red-400 font-bold flex items-center gap-1">
                                                    <X size={12} /> Booked
                                                    {isAdmin && <span className="text-[var(--text-tertiary)] font-normal">({approvedRequest.agency_name})</span>}
                                                </div>
                                            ) : (
                                                <>
                                                    {isAgency && !selfRequest && (
                                                        <form action={requestAvailabilitySlot}>
                                                            <input type="hidden" name="slotId" value={slot.id} />
                                                            <input type="hidden" name="agencyId" value={agencyId} />
                                                            <button className="w-full bg-violet-600 hover:bg-violet-500 text-white text-xs py-1 rounded font-medium mt-1">
                                                                Request Booking
                                                            </button>
                                                        </form>
                                                    )}
                                                    {selfRequest && (
                                                        <div className="text-xs text-amber-400 font-bold flex items-center gap-1">
                                                            <Clock size={12} /> Pending Approval
                                                        </div>
                                                    )}
                                                    {!isAgency && !isAdmin && <div className="text-xs text-emerald-400 font-bold">Available</div>}
                                                </>
                                            )}

                                            {/* Admin Request Handling */}
                                            {isAdmin && slotRequests.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                                                    {slotRequests.map(req => (
                                                        <div key={req.id} className="flex justify-between items-center text-xs">
                                                            <span className={req.status === 'Approved' ? 'text-emerald-400' : 'text-[var(--text-tertiary)]'}>
                                                                {req.agency_name}
                                                            </span>
                                                            {req.status === 'Pending' && (
                                                                <div className="flex gap-1">
                                                                    <form action={updateAvailabilityRequest}>
                                                                        <input type="hidden" name="id" value={req.id} />
                                                                        <input type="hidden" name="status" value="Approved" />
                                                                        <input type="hidden" name="slotId" value={slot.id} />
                                                                        <button className="text-emerald-400 hover:bg-emerald-500/20 p-1 rounded"><Check size={12} /></button>
                                                                    </form>
                                                                    <form action={updateAvailabilityRequest}>
                                                                        <input type="hidden" name="id" value={req.id} />
                                                                        <input type="hidden" name="status" value="Rejected" />
                                                                        <input type="hidden" name="slotId" value={slot.id} />
                                                                        <button className="text-red-400 hover:bg-red-500/20 p-1 rounded"><X size={12} /></button>
                                                                    </form>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
