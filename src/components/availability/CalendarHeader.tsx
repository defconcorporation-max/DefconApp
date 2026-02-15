'use client';

import { format, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from 'lucide-react';

interface CalendarHeaderProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    isAdmin: boolean;
    view: 'week' | 'day';
    onViewChange: (view: 'week' | 'day') => void;
}

export default function CalendarHeader({ currentDate, onDateChange, isAdmin, view, onViewChange }: CalendarHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0A0A0A] border border-[var(--border-subtle)] p-4 rounded-xl mb-6 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-[var(--bg-surface)] rounded-lg p-1 border border-[var(--border-subtle)]">
                    <button
                        onClick={() => onDateChange(subWeeks(currentDate, 1))}
                        className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-md transition-colors text-[var(--text-secondary)] hover:text-white"
                        aria-label="Previous week"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => onDateChange(new Date())}
                        className="px-3 py-1 text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors border-x border-[var(--border-subtle)]"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => onDateChange(addWeeks(currentDate, 1))}
                        className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-md transition-colors text-[var(--text-secondary)] hover:text-white"
                        aria-label="Next week"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="text-violet-500" size={20} />
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
            </div>

            <div className="flex items-center gap-3">
                {isAdmin && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold uppercase tracking-wide">Admin Mode</span>
                    </div>
                )}

                {/* View Switcher (Future) */}
                <div className="flex bg-[var(--bg-surface)] rounded-lg p-1 border border-[var(--border-subtle)]">
                    <button
                        onClick={() => onViewChange('week')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'week' ? 'bg-[var(--bg-surface-hover)] text-white shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => onViewChange('day')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'day' ? 'bg-[var(--bg-surface-hover)] text-white shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                    >
                        Day
                    </button>
                </div>
            </div>
        </div>
    );
}
