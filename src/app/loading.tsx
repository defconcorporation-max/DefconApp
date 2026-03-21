import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
            <div className="relative">
                <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full animate-pulse"></div>
                <Loader2 className="w-10 h-10 text-violet-400 animate-spin relative z-10" />
            </div>
            <p className="mt-4 text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-widest animate-pulse">
                Loading workspace...
            </p>
        </div>
    );
}
