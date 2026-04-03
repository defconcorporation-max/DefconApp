'use client';

import { useState } from 'react';
import { X, Calendar, Clock, Loader2, Building, Mail, Briefcase, FileText } from 'lucide-react';
import { submitPublicShootRequest } from '@/app/public-actions';

interface PublicBookingModalProps {
    date: Date;
    startHour: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PublicBookingModal({ date, startHour, onClose, onSuccess }: PublicBookingModalProps) {
    const [duration, setDuration] = useState(3);
    const [requestType, setRequestType] = useState('shoot');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const formData = new FormData(e.currentTarget);

        const actualDuration = requestType === 'meeting_30' ? 0.5 : requestType === 'meeting_60' ? 1 : duration;
        
        // Handle decimals for half hours
        const endHourVal = startHour + actualDuration;
        const endHourInt = Math.floor(endHourVal);
        const endMinStr = (endHourVal % 1) !== 0 ? '30' : '00';
        
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const startTimeStr = `${String(startHour).padStart(2, '0')}:00`;
        const endTimeStr = `${String(endHourInt).padStart(2, '0')}:${endMinStr}`;

        formData.append('date', dateStr);
        formData.append('startTime', startTimeStr);
        formData.append('endTime', endTimeStr);
        formData.append('requestType', requestType);

        try {
            await submitPublicShootRequest(formData);
            onSuccess();
        } catch (err: any) {
            setError(err?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const dateFormatted = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timeFormatted = `${startHour > 12 ? startHour - 12 : startHour}:00 ${startHour >= 12 ? 'PM' : 'AM'}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl w-full max-w-lg overflow-y-auto custom-scrollbar shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-white/[0.02]">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Request a Shoot</h2>
                        <p className="text-sm text-[var(--text-tertiary)] flex items-center gap-2">
                            <Calendar size={14} className="text-indigo-400" /> {dateFormatted}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[var(--text-tertiary)] hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Request Type Selection */}
                    <div className="grid grid-cols-3 gap-3">
                        <label className={`cursor-pointer border p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${requestType === 'shoot' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                            <input type="radio" name="reqTypeRadio" value="shoot" checked={requestType === 'shoot'} onChange={() => setRequestType('shoot')} className="hidden" />
                            <Calendar size={20} className={requestType === 'shoot' ? 'text-indigo-400' : 'text-gray-400'} />
                            <span className={`text-xs font-medium ${requestType === 'shoot' ? 'text-indigo-200' : 'text-gray-400'}`}>Shoot</span>
                        </label>
                        <label className={`cursor-pointer border p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${requestType === 'meeting_30' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                            <input type="radio" name="reqTypeRadio" value="meeting_30" checked={requestType === 'meeting_30'} onChange={() => setRequestType('meeting_30')} className="hidden" />
                            <Clock size={20} className={requestType === 'meeting_30' ? 'text-emerald-400' : 'text-gray-400'} />
                            <span className={`text-xs font-medium ${requestType === 'meeting_30' ? 'text-emerald-200' : 'text-gray-400'}`}>30m Call</span>
                        </label>
                        <label className={`cursor-pointer border p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${requestType === 'meeting_60' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                            <input type="radio" name="reqTypeRadio" value="meeting_60" checked={requestType === 'meeting_60'} onChange={() => setRequestType('meeting_60')} className="hidden" />
                            <Clock size={20} className={requestType === 'meeting_60' ? 'text-emerald-400' : 'text-gray-400'} />
                            <span className={`text-xs font-medium ${requestType === 'meeting_60' ? 'text-emerald-200' : 'text-gray-400'}`}>1h Call</span>
                        </label>
                    </div>

                    {/* Time selection */}
                    <div className={`${requestType === 'shoot' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} border rounded-xl p-4 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${requestType === 'shoot' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                <Clock size={20} />
                            </div>
                            <div>
                                <div className={`text-sm font-medium ${requestType === 'shoot' ? 'text-indigo-200' : 'text-emerald-200'}`}>Starting at {timeFormatted}</div>
                                <div className={`text-xs mt-0.5 ${requestType === 'shoot' ? 'text-indigo-400/80' : 'text-emerald-400/80'}`}>
                                    {requestType === 'shoot' ? 'Minimum 3 hours required' : (requestType === 'meeting_30' ? '30 minutes meeting' : '1 hour meeting')}
                                </div>
                            </div>
                        </div>
                        {requestType === 'shoot' && (
                            <div className="flex flex-col items-end">
                                <label className="text-[10px] text-indigo-300 uppercase tracking-wider font-bold mb-1">Duration</label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="bg-[#111] border border-indigo-500/30 text-white text-sm rounded-lg px-3 py-1.5 focus:border-indigo-500 outline-none"
                                >
                                    {[3, 4, 5, 6, 7, 8, 9, 10].map(h => (
                                        <option key={h} value={h}>{h} hours</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Client Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                                <Building size={12} /> Company Name *
                            </label>
                            <input name="companyName" required className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] text-white text-sm rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all placeholder:text-[var(--text-tertiary)]" placeholder="e.g. Acme Corp" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                                <Briefcase size={12} /> Client (Optional)
                            </label>
                            <input name="clientName" className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] text-white text-sm rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all placeholder:text-[var(--text-tertiary)]" placeholder="Related client..." />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                                <FileText size={12} /> Contact Name *
                            </label>
                            <input name="contactName" required className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] text-white text-sm rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all placeholder:text-[var(--text-tertiary)]" placeholder="John Doe" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                                <Mail size={12} /> Email *
                            </label>
                            <input type="email" name="email" required className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] text-white text-sm rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all placeholder:text-[var(--text-tertiary)]" placeholder="contact@company.com" />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                                <Mail size={12} /> Phone Number
                            </label>
                            <input type="tel" name="phone" className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] text-white text-sm rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all placeholder:text-[var(--text-tertiary)]" placeholder="+1 234 567 8900" />
                        </div>
                    </div>

                    {/* Project Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                            <Briefcase size={12} /> Project Type *
                        </label>
                        <select name="projectType" required className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] text-white text-sm rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer">
                            <option value="">Select project type...</option>
                            <option value="Social Media">Social Media</option>
                            <option value="Corporate">Corporate / Commercial</option>
                            <option value="Interview">Interview / Talking Head</option>
                            <option value="Music Video">Music Video</option>
                            <option value="Event">Event Coverage</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                            <FileText size={12} /> Additional Information
                        </label>
                        <textarea
                            name="additionalInfo"
                            rows={3}
                            className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] text-white text-sm rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all placeholder:text-[var(--text-tertiary)] resize-none"
                            placeholder="Tell us a bit about your project..."
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="flex-[2] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : 'Request Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

