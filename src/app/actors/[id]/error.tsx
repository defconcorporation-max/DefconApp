'use client';

import Link from 'next/link';

export default function ActorDetailError({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 font-mono text-left break-all">
                    {error?.message || 'Unknown error'}
                </p>
                <p className="text-sm text-[var(--text-tertiary)] mb-6">
                    Try hitting <code className="text-violet-400">/api/migrate</code> first to create the required database tables.
                </p>
                <div className="flex gap-3 justify-center">
                    <button onClick={reset} className="px-4 py-2 bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition-colors">
                        Try Again
                    </button>
                    <Link href="/actors" className="px-4 py-2 border border-[var(--border-subtle)] text-sm rounded hover:bg-white/5 transition-colors text-white">
                        Back to Actors
                    </Link>
                </div>
            </div>
        </main>
    );
}
