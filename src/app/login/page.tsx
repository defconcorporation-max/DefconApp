'use client';

import { authenticate } from '@/app/login/actions';
import { useFormState, useFormStatus } from 'react-dom';
import { Lock, Loader2 } from 'lucide-react';

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
        >
            {pending ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
        </button>
    );
}

export default function LoginPage() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

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

                <form action={dispatch} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase mb-2">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full bg-[#1A1A1A] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="agent@defcon.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase mb-2">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-[#1A1A1A] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {errorMessage && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                            {errorMessage}
                        </div>
                    )}

                    <LoginButton />
                </form>
            </div>
        </div>
    );
}
