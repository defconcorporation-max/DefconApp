'use client';

import { authenticate } from '@/app/login/actions';
import { useFormState, useFormStatus } from 'react-dom';
import { LayoutGrid, Loader2, Lock, Mail, ChevronRight } from 'lucide-react';
import { useState } from 'react';

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20 flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {pending ? (
                <Loader2 className="animate-spin" size={20} />
            ) : (
                <>
                    Enter Portal
                    <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </>
            )}
        </button>
    );
}

export default function ClientLoginPage() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);
    const [focused, setFocused] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-2xl border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 shadow-inner">
                        <LayoutGrid size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2 text-center">Defcon <span className="text-emerald-500">Portal</span></h1>
                    <p className="text-[var(--text-tertiary)] text-sm text-center">Manage your projects & review deliverables</p>
                </div>

                <form action={dispatch} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2 tracking-wider">Email Address</label>
                        <div className={`relative transition-all duration-300 ${focused === 'email' ? 'scale-[1.02]' : ''}`}>
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focused === 'email' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                <Mail size={18} />
                            </div>
                            <input
                                name="email"
                                type="email"
                                required
                                onFocus={() => setFocused('email')}
                                onBlur={() => setFocused(null)}
                                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-800/80 transition-all placeholder:text-zinc-600"
                                placeholder="you@company.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2 tracking-wider">Secure Password</label>
                        <div className={`relative transition-all duration-300 ${focused === 'password' ? 'scale-[1.02]' : ''}`}>
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focused === 'password' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                <Lock size={18} />
                            </div>
                            <input
                                name="password"
                                type="password"
                                required
                                onFocus={() => setFocused('password')}
                                onBlur={() => setFocused(null)}
                                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-800/80 transition-all placeholder:text-zinc-600"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center justify-center gap-2 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {errorMessage}
                        </div>
                    )}

                    <div className="pt-2">
                        <LoginButton />
                    </div>

                    <div className="text-center pt-4">
                        <p className="text-xs text-zinc-500">
                            Lost your access? <a href="mailto:support@defcon.app" className="text-emerald-500/80 hover:text-emerald-400 transition-colors font-medium">Contact Management</a>
                        </p>
                    </div>
                </form>
            </div>
            
            <div className="absolute bottom-8 text-zinc-600 text-[10px] uppercase tracking-[0.2em]">
                &copy; {new Date().getFullYear()} Defcon App. Built for visual Excellence.
            </div>
        </div>
    );
}
