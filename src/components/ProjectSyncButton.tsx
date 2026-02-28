'use client';

import { useState } from 'react';
import { Receipt, Check } from 'lucide-react';
import { syncProjectToExpenses } from '@/app/actions';

export default function ProjectSyncButton({ projectId }: { projectId: number }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSynced, setIsSynced] = useState(false);

    const handleSync = async () => {
        if (isSyncing) return;
        if (!confirm('Log this project as a business expense?')) return;

        setIsSyncing(true);
        try {
            const result = await syncProjectToExpenses(projectId);
            if (result.success) {
                setIsSynced(true);
                setTimeout(() => setIsSynced(false), 3000);
            } else {
                alert('Sync failed: ' + result.error);
            }
        } catch (err) {
            alert('An error occurred.');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${isSynced
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                : 'bg-white/5 text-[var(--text-tertiary)] hover:text-emerald-400 border-white/5 hover:border-emerald-500/20'
                }`}
        >
            {isSyncing ? (
                <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : isSynced ? (
                <Check size={12} />
            ) : (
                <Receipt size={12} />
            )}
            {isSynced ? 'Logged' : 'Sync to Expenses'}
        </button>
    );
}
