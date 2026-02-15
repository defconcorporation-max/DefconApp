import { useState, useEffect } from 'react';
import { createAvailabilitySlot, updateAvailabilitySlot } from '@/app/actions';
import { X, Clock, Calendar as CalendarIcon, Check, Edit } from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';

interface SlotModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: Date;
    initialStartTime?: string; // HH:mm
    initialSlot?: { id: number; start_time: string; end_time: string };
    mode?: 'create' | 'block' | 'edit';
}

export default function SlotModal({ isOpen, onClose, initialDate, initialStartTime, initialSlot, mode = 'create' }: SlotModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('10:00');
    const [duration, setDuration] = useState('2'); // hours

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            if (initialSlot) {
                const start = new Date(initialSlot.start_time);
                const end = new Date(initialSlot.end_time);
                setDate(format(start, 'yyyy-MM-dd'));
                setStartTime(format(start, 'HH:mm'));
                
                // Calculate duration in hours (approx)
                const diffMins = differenceInMinutes(end, start);
                const diffHours = Math.round(diffMins / 60);
                if ([1, 2, 3, 4, 8].includes(diffHours)) {
                    setDuration(diffHours.toString());
                } else {
                    setDuration('custom'); // Handle custom duration if needed, for now default to nearest or keep simple
                }
            } else {
                if (initialDate) setDate(format(initialDate, 'yyyy-MM-dd'));
                if (initialStartTime) setStartTime(initialStartTime);
            }
        }
    }, [isOpen, initialDate, initialStartTime, initialSlot]);

    if (!isOpen) return null;

    // UI Theme based on mode
    const isBlock = mode === 'block';
    const isEdit = mode === 'edit';
    const accentColor = (isBlock || isEdit) ? 'red' : 'violet';
    
    let title = 'New Availability Slot';
    let buttonText = 'Create Slot';
    if (isBlock) {
        title = 'Add Unavailability';
        buttonText = 'Block Time';
    } else if (isEdit) {
        title = 'Edit Unavailability';
        buttonText = 'Update Block';
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Calculate end time
            const [hours, minutes] = startTime.split(':').map(Number);
            
            // If custom duration logic needed later, handle here. For now rely on select.
            const durHours = duration === 'custom' ? 2 : Number(duration); 
            
            const totalMinutes = hours * 60 + minutes + durHours * 60;
            const endHours = Math.floor(totalMinutes / 60);
            const endMinutes = totalMinutes % 60;
            const endTimeStr = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

            const start = `${date} ${startTime}`;
            const end = `${date} ${endTimeStr}`;

            if (isEdit && initialSlot) {
                await updateAvailabilitySlot(initialSlot.id, start, end);
            } else {
                await createAvailabilitySlot(start, end);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save slot', error);
            alert('Failed to save slot');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0f0f0f] border border-[var(--border-subtle)] rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-surface)]">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        {isEdit ? <Edit size={16} className={`text-${accentColor}-400`} /> : <Clock size={16} className={`text-${accentColor}-400`} />}
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Date</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" size={16} />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className={`w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-${accentColor}-500 focus:ring-1 focus:ring-${accentColor}-500 transition-all`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Start Time</label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className={`w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-${accentColor}-500 focus:ring-1 focus:ring-${accentColor}-500 transition-all`}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Duration</label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className={`w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-${accentColor}-500 focus:ring-1 focus:ring-${accentColor}-500 transition-all appearance-none`}
                                >
                                    <option value="1">1 Hour</option>
                                    <option value="2">2 Hours</option>
                                    <option value="3">3 Hours</option>
                                    <option value="4">4 Hours</option>
                                    <option value="8">Full Day (8h)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`bg-${accentColor}-600 hover:bg-${accentColor}-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-${accentColor}-600/20 disabled:opacity-50 flex items-center gap-2`}
                        >
                            {isLoading ? 'Processing...' : (
                                <>
                                    {isEdit ? <Check size={16} /> : (isBlock ? <X size={16} /> : <Check size={16} />)} {buttonText}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
