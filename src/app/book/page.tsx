import PublicBookingForm from '@/components/PublicBookingForm';
import { Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function BookPage() {
    return (
        <main className="min-h-screen bg-[#050505] text-white flex flex-col pt-12 pb-20 px-4 items-center relative overflow-hidden">

            {/* Background Accents (Glassmorphism blobs) */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl mb-6 shadow-xl backdrop-blur-md">
                        <Calendar size={32} className="text-indigo-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Book a Session
                    </h1>
                    <p className="text-[var(--text-secondary)] text-lg max-w-md mx-auto">
                        Ready to elevate your visual content? Request a date and tell us about your project.
                    </p>
                </div>

                {/* Form Card */}
                <div className="backdrop-blur-xl bg-white/[0.02] border border-white/5 p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                    {/* Subtle inner highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <PublicBookingForm />
                </div>

                {/* Footer disclaimer */}
                <div className="text-center mt-8 text-xs text-[var(--text-tertiary)] max-w-sm mx-auto">
                    Submitting this form does not guarantee the booking. Our team will review your request and get back to you within 24 hours.
                </div>
            </div>
        </main>
    );
}
