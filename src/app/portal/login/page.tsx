'use client';

import { clientLogin } from '@/app/portal-actions';
import { useState, useTransition } from 'react';
import { LayoutGrid, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ClientLoginPage() {
    const [error, setError] = useState<string>('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setError('');
        startTransition(async () => {
            const result = await clientLogin(formData);
            if (result?.error) {
                setError(result.error);
            } else {
                router.push('/portal/dashboard');
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-emerald-400">
                        <LayoutGrid size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Client Portal</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Access your projects & invoices</p>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase mb-2">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full bg-[#1A1A1A] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="you@company.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase mb-2">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-[#1A1A1A] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
                    >
                        {isPending ? <Loader2 className="animate-spin" size={20} /> : 'Enter Portal'}
                    </button>

                    <p className="text-center text-xs text-[var(--text-tertiary)] mt-4">
                        Don't have a login? Contact your project manager.
                    </p>
                </form>
            </div>
        </div>
    );
}
