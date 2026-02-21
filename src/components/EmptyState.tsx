import { LucideIcon } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white/[0.02]">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-[var(--text-tertiary)] group-hover:bg-white/10 transition-colors">
                <Icon size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-[var(--text-tertiary)] max-w-sm mb-6">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
