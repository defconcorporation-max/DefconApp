import { useState, useEffect } from 'react';
import { createAvailabilitySlot, updateAvailabilitySlot, updateShootTime, toggleShootBlocking, requestShoot, approveShoot, denyShoot, updateShootClient } from '@/app/actions';
import { X, Clock, Calendar as CalendarIcon, Check, Edit, Video, Unlock, Send, ThumbsUp, ThumbsDown, User } from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface SlotModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: Date;
    initialStartTime?: string; // HH:mm
    initialSlot?: { id: number; start_time: string; end_time: string; coverage_type?: string }; // For manual blocks
    initialShoot?: { id: number; shoot_date: string; start_time?: string; end_time?: string; is_blocking: number; title?: string; project_title?: string; status?: string; client_id?: number; client_name?: string }; // For shoots
    mode?: 'create' | 'block' | 'edit' | 'edit-shoot' | 'request' | 'approve';
    agencyId?: number;
    clients?: { id: number; name: string; company_name: string }[];
}

export default function SlotModal({ isOpen, onClose, initialDate, initialStartTime, initialSlot, initialShoot, mode = 'create', agencyId, clients = [] }: SlotModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('10:00');
    const [duration, setDuration] = useState('2'); // hours
    const [coverageType, setCoverageType] = useState('full'); // 'full' | 'half'

    // New fields for request
    const [title, setTitle] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string>(''); // '' = no selection, 'new' = new client, number = existing

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setTitle(''); // Reset title
            setSelectedClientId(''); // Reset client selection
            if ((mode === 'edit-shoot' || mode === 'approve') && initialShoot) {
                // Shoot Data
                let sTime = initialShoot.start_time || '09:00';
                const sDate = initialShoot.shoot_date || format(new Date(), 'yyyy-MM-dd');

                if (sDate.includes(' ')) {
                    try {
                        setDate(sDate.split(' ')[0]);
                        if (!initialShoot.start_time) {
                            const parts = sDate.split(' ');
                            if (parts.length > 1) sTime = parts[1].substring(0, 5);
                        }
                    } catch (e) {
                        setDate(format(new Date(), 'yyyy-MM-dd'));
                    }
                } else {
                    setDate(sDate);
                }
                setStartTime(sTime ? sTime.substring(0, 5) : '09:00');

                // Duration
                if (initialShoot.start_time && initialShoot.end_time) {
                    const start = new Date(`2000-01-01 ${initialShoot.start_time}`);
                    const end = new Date(`2000-01-01 ${initialShoot.end_time}`);
                    const diff = differenceInMinutes(end, start);
                    const hours = Math.round(diff / 60);
                    if ([1, 2, 3, 4, 8].includes(hours)) setDuration(hours.toString());
                    else setDuration('custom');
                } else {
                    setDuration('8');
                }

                // Set client selection for edit-shoot mode
                if (initialShoot.client_id) {
                    setSelectedClientId(String(initialShoot.client_id));
                }

                // For approve mode, set title if available
                if (mode === 'approve' && (initialShoot.title || initialShoot.project_title)) {
                    setTitle(initialShoot.title || initialShoot.project_title || '');
                }

            } else if (mode === 'edit' && initialSlot) {
                const start = new Date(initialSlot.start_time);
                const end = new Date(initialSlot.end_time);
                setDate(format(start, 'yyyy-MM-dd'));
                setStartTime(format(start, 'HH:mm'));
                if (initialSlot.coverage_type) setCoverageType(initialSlot.coverage_type);

                const diffMins = differenceInMinutes(end, start);
                const diffHours = Math.round(diffMins / 60);
                if ([1, 2, 3, 4, 8].includes(diffHours)) {
                    setDuration(diffHours.toString());
                } else {
                    setDuration('custom');
                }
            } else {
                if (initialDate) setDate(format(initialDate, 'yyyy-MM-dd'));
                if (initialStartTime) setStartTime(initialStartTime);
            }
        }
    }, [isOpen, initialDate, initialStartTime, initialSlot, initialShoot, mode]);

    if (!isOpen) return null;

    // UI Theme based on mode
    const isBlock = mode === 'block';
    const isEdit = mode === 'edit';
    const isEditShoot = mode === 'edit-shoot';
    const isRequest = mode === 'request';
    const isApprove = mode === 'approve';

    const accentColor = (isBlock || isEdit) ? 'red' : (isRequest ? 'indigo' : (isApprove ? 'amber' : 'violet'));

    let modalTitle = 'New Availability Slot';
    let buttonText = 'Create Slot';
    let Icon = Clock;

    if (isBlock) {
        modalTitle = 'Add Unavailability';
        buttonText = 'Block Time';
        Icon = X;
    } else if (isEdit) {
        modalTitle = 'Edit Unavailability';
        buttonText = 'Update Block';
        Icon = Edit;
    } else if (isEditShoot) {
        modalTitle = 'Edit Shoot';
        buttonText = 'Update Shoot';
        Icon = Video;
    } else if (isRequest) {
        modalTitle = 'Request Shoot';
        buttonText = 'Send Request';
        Icon = Send;
    } else if (isApprove) {
        modalTitle = 'Confirm Request';
        buttonText = 'Approve';
        Icon = Check;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Calculate end time
            const [hours, minutes] = startTime.split(':').map(Number);
            const durHours = duration === 'custom' ? 2 : Number(duration);
            const totalMinutes = hours * 60 + minutes + durHours * 60;
            const endHours = Math.floor(totalMinutes / 60);
            const endMinutes = totalMinutes % 60;
            const endTimeStr = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

            const startStr = `${date} ${startTime}`;
            const endStr = `${date} ${endTimeStr}`;

            if (isRequest) {
                if (!agencyId) throw new Error('No agency ID found');
                await requestShoot(title, date, startTime, endTimeStr, agencyId, selectedClientId || undefined);
                toast.success('Booking requested successfully!');
            } else if (isApprove && initialShoot) {
                await updateShootTime(initialShoot.id, startStr, endStr);
                await approveShoot(initialShoot.id);
                // Update client if changed
                if (selectedClientId && Number(selectedClientId) > 0 && Number(selectedClientId) !== initialShoot.client_id) {
                    await updateShootClient(initialShoot.id, Number(selectedClientId));
                }
                toast.success('Shoot approved and scheduled!');
            } else if (isEditShoot && initialShoot) {
                await updateShootTime(initialShoot.id, startStr, endStr);
                // Update client if changed
                if (selectedClientId && Number(selectedClientId) > 0 && Number(selectedClientId) !== initialShoot.client_id) {
                    await updateShootClient(initialShoot.id, Number(selectedClientId));
                }
                toast.success('Shoot details updated!');
            } else if (isEdit && initialSlot) {
                await updateAvailabilitySlot(initialSlot.id, startStr, endStr, coverageType);
                toast.success('Unavailability block updated!');
            } else {
                await createAvailabilitySlot(startStr, endStr, coverageType);
                toast.success('Time blocked successfully!');
            }
            onClose();
        } catch (error) {
            console.error('Failed to save slot', error);
            toast.error('Failed to save. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeny = async () => {
        if (!initialShoot) return;
        if (confirm('Deny this shoot request? This will remove the request.')) {
            try {
                await denyShoot(initialShoot.id);
                toast.success('Shoot request denied');
                onClose();
            } catch (err) {
                toast.error('Failed to deny request');
            }
        }
    };

    const handleUnblock = async () => {
        if (!initialShoot) return;
        if (confirm('Unblock this shoot? This will remove the Unavailable block but keep the shoot event.')) {
            try {
                await toggleShootBlocking(initialShoot.id, false);
                toast.success('Shoot unblocked');
                onClose();
            } catch (err) {
                toast.error('Failed to unblock shoot');
            }
        }
    };

    // Show client selector for: request mode, edit-shoot mode, approve mode
    const showClientSelector = isRequest || isEditShoot || isApprove;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0f0f0f] border border-[var(--border-subtle)] rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-surface)]">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <Icon size={16} className={`text-${accentColor}-400`} />
                        {modalTitle}
                    </h3>
                    <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    <div className="space-y-4">

                        {isRequest && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Shoot Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Campaign Launch"
                                    className={`w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-${accentColor}-500 focus:ring-1 focus:ring-${accentColor}-500 transition-all`}
                                    required
                                />
                            </div>
                        )}

                        {/* Client Selector */}
                        {showClientSelector && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase flex items-center gap-1">
                                    <User size={12} />
                                    Client
                                </label>
                                <select
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                    className={`w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-${accentColor}-500 focus:ring-1 focus:ring-${accentColor}-500 transition-all appearance-none`}
                                >
                                    <option value="">— No client assigned —</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={String(client.id)}>
                                            {client.company_name || client.name}
                                        </option>
                                    ))}
                                    {isRequest && <option value="new">+ New Client (will be Pending)</option>}
                                </select>
                            </div>
                        )}

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

                        {/* Coverage Type for Blocks */}
                        {(isBlock || isEdit) && (
                            <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Coverage Type</label>
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <label className={`flex items-center justify-center p-2.5 rounded-lg border cursor-pointer transition-colors ${coverageType === 'full' ? `bg-${accentColor}-500/20 border-${accentColor}-500/50 text-${accentColor}-200` : 'bg-[var(--bg-root)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:bg-white/[0.02]'}`}>
                                        <input type="radio" name="coverageType" value="full" checked={coverageType === 'full'} onChange={() => setCoverageType('full')} className="sr-only" />
                                        <span className="text-sm font-medium">Full Team</span>
                                    </label>
                                    <label className={`flex items-center justify-center p-2.5 rounded-lg border cursor-pointer transition-colors ${coverageType === 'half' ? `bg-${accentColor}-500/20 border-${accentColor}-500/50 text-${accentColor}-200` : 'bg-[var(--bg-root)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:bg-white/[0.02]'}`}>
                                        <input type="radio" name="coverageType" value="half" checked={coverageType === 'half'} onChange={() => setCoverageType('half')} className="sr-only" />
                                        <span className="text-sm font-medium">Half Team (Split)</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        {isEditShoot && !isRequest && !isApprove && (
                            <button
                                type="button"
                                onClick={handleUnblock}
                                className="mr-auto px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors flex items-center gap-1"
                            >
                                <Unlock size={14} /> Unblock
                            </button>
                        )}

                        {isApprove && (
                            <button
                                type="button"
                                onClick={handleDeny}
                                className="mr-auto px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors flex items-center gap-1"
                            >
                                <ThumbsDown size={14} /> Deny
                            </button>
                        )}

                        {initialShoot && (isEditShoot || isApprove || isBlock) && !isRequest && initialShoot.id && (
                            <Link
                                href={`/shoots/${initialShoot.id}`}
                                className="px-3 py-2 text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded transition-colors flex items-center gap-1 ml-auto mr-2"
                            >
                                View Details
                            </Link>
                        )}

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
            </div >
        </div >
    );
}
