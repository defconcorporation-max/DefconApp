'use client';

import { login } from '@/app/auth-actions';
import { useState, useTransition } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [error, setError] = useState<string>('');
    const [isPending, startTransition] = useTransition();
    const [email, setEmail] = useState('');     // Controlled for easier focus management/transition
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        startTransition(async () => {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);

            const result = await login(formData);
            if (result?.error) {
                setError(result.error);
            } else {
                router.refresh(); // Refresh middleware/router cache
                // Redirect handled by middleware mostly, but good to force nav
                router.push('/');
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 text-indigo-400">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Defcon Agency</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Authorized Access Only</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="agent@defcon.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
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
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
                    >
                        {isPending ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
