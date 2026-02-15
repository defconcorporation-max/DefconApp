'use client';

import SalesPlaybookButton from '@/components/settings/SalesPlaybookButton';
import { Download } from 'lucide-react';
import Link from 'next/link';

export default function SalesPlaybookPage() {
    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 bg-[#0A0A0A] border border-[var(--border-subtle)] p-8 rounded-2xl shadow-2xl">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                        <Download size={32} className="text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Sales Playbook</h1>
                    <p className="text-[var(--text-secondary)] text-sm">
                        Download the official sales training guide and pricing sheet.
                    </p>
                </div>

                <div className="space-y-4">
                    <SalesPlaybookButton />

                    <div className="text-center pt-4">
                        <Link href="/" className="text-xs text-[var(--text-tertiary)] hover:text-white transition-colors">
                            ← Return to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <p className="fixed bottom-4 text-[10px] text-[var(--text-tertiary)]">
                Defcon Corporation • Confidential Document
            </p>
        </main>
    );
}
