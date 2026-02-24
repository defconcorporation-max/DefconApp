'use client';

import { useState } from 'react';
import { submitPublicBooking } from '@/app/actions';
import { Calendar, User, Mail, Phone, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicBookingForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // We could pass in unavailable dates to disable them, but for a simple V1, 
    // a date picker and a text input is extremely fast to set up.

    return (
        <form action={async (formData) => {
            setIsSubmitting(true);
            try {
                const res = await submitPublicBooking(formData);
                if (res?.error) {
                    toast.error(res.error);
                } else {
                    toast.success("Booking request sent! We'll contact you shortly.");
                    (document.getElementById('booking-form') as HTMLFormElement).reset();
                }
            } catch (e) {
                toast.error("Failed to submit request.");
            } finally {
                setIsSubmitting(false);
            }
        }} id="booking-form" className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                        <User size={14} /> Full Name
                    </label>
                    <input name="name" required className="w-full bg-black/50 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white placeholder-[var(--text-tertiary)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="John Doe" />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                        <Mail size={14} /> Email Address
                    </label>
                    <input name="email" type="email" required className="w-full bg-black/50 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white placeholder-[var(--text-tertiary)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="john@example.com" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                        <Phone size={14} /> Phone Number
                    </label>
                    <input name="phone" type="tel" className="w-full bg-black/50 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white placeholder-[var(--text-tertiary)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="+1 (555) 000-0000" />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} /> Requested Date
                    </label>
                    <input name="date" type="date" required className="w-full bg-black/50 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all [color-scheme:dark]" />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} /> Project Details & Location
                </label>
                <textarea name="description" required rows={4} className="w-full bg-black/50 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white placeholder-[var(--text-tertiary)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none custom-scrollbar" placeholder="Tell us about the shoot you have in mind..."></textarea>
            </div>

            <button
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-lg shadow-indigo-500/20"
            >
                {isSubmitting ? 'Sending Request...' : 'Submit Booking Request'}
            </button>
        </form>
    );
}
