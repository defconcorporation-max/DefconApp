'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckSquare, LayoutGrid, CalendarDays } from 'lucide-react';
import Link from 'next/link';

interface WorkloadDashboardProps {
    members: any[];
    workload: Record<string, any>;
    startDateStr: string;
    endDateStr: string;
}

function getScoreColor(score: number) {
    if (score === 0) return 'bg-[#111] border-[var(--border-subtle)]';
    if (score <= 1) return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
    if (score <= 3) return 'bg-indigo-500/30 border-indigo-500/40 text-indigo-300';
    if (score <= 5) return 'bg-orange-500/30 border-orange-500/40 text-orange-300';
    return 'bg-red-500/30 border-red-500/40 text-red-300';
}

function getHeaderColor(score: number) {
    if (score === 0) return 'text-[var(--text-tertiary)] bg-white/5 border-b-[var(--border-subtle)]';
    if (score <= 1) return 'text-emerald-400 bg-emerald-500/10 border-b-emerald-500/30';
    if (score <= 3) return 'text-indigo-400 bg-indigo-500/10 border-b-indigo-500/30';
    if (score <= 5) return 'text-orange-400 bg-orange-500/10 border-b-orange-500/30';
    return 'text-red-400 bg-red-500/10 border-b-red-500/30';
}

export default function WorkloadDashboard({ members, workload, startDateStr, endDateStr }: WorkloadDashboardProps) {
    const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
    const [weekOffset, setWeekOffset] = useState(0);
    const [dayOffset, setDayOffset] = useState(0);

    const baseStartDate = new Date(startDateStr);

    // Generate dates based on view mode
    const dates: string[] = [];
    if (viewMode === 'monthly') {
        const start = new Date(baseStartDate);
        const end = new Date(endDateStr);
        while (start <= end) {
            dates.push(start.toISOString().split('T')[0]);
            start.setDate(start.getDate() + 1);
        }
    } else if (viewMode === 'weekly') {
        // Weekly mapping from start date + offset
        const start = new Date(baseStartDate);
        start.setDate(start.getDate() + (weekOffset * 7));
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
    } else if (viewMode === 'daily') {
        const start = new Date(baseStartDate);
        start.setDate(start.getDate() + dayOffset);
        dates.push(start.toISOString().split('T')[0]);
    }

    const currentWeekStart = new Date(baseStartDate);
    currentWeekStart.setDate(currentWeekStart.getDate() + (weekOffset * 7));
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

    const getDayHeader = (dateStr: string) => {
        const d = new Date(dateStr);
        return {
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: d.getDate(),
            fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex bg-[#111] border border-[var(--border-subtle)] rounded-lg p-1">
                    <button
                        onClick={() => { setViewMode('monthly'); setWeekOffset(0); setDayOffset(0); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'monthly' ? 'bg-indigo-600 text-white' : 'text-[var(--text-secondary)] hover:text-white'
                            }`}
                    >
                        <LayoutGrid size={16} /> Overview
                    </button>
                    <button
                        onClick={() => { setViewMode('weekly'); setWeekOffset(0); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'weekly' ? 'bg-indigo-600 text-white' : 'text-[var(--text-secondary)] hover:text-white'
                            }`}
                    >
                        <CalendarDays size={16} /> Weekly Details
                    </button>
                    <button
                        onClick={() => { setViewMode('daily'); setDayOffset(0); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'daily' ? 'bg-indigo-600 text-white' : 'text-[var(--text-secondary)] hover:text-white'
                            }`}
                    >
                        <CalendarIcon size={16} /> Daily Detail
                    </button>
                </div>

                {viewMode === 'weekly' && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setWeekOffset(prev => prev - 1)}
                            className="p-2 border border-[var(--border-subtle)] bg-[#111] hover:bg-white/5 rounded-lg text-white transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-bold text-white w-40 text-center uppercase tracking-wider">
                            {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {currentWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <button
                            onClick={() => setWeekOffset(prev => prev + 1)}
                            className="p-2 border border-[var(--border-subtle)] bg-[#111] hover:bg-white/5 rounded-lg text-white transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                {viewMode === 'daily' && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDayOffset(prev => prev - 1)}
                            className="p-2 border border-[var(--border-subtle)] bg-[#111] hover:bg-white/5 rounded-lg text-white transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-bold text-white w-48 text-center uppercase tracking-wider">
                            {(() => {
                                const d = new Date(baseStartDate);
                                d.setDate(d.getDate() + dayOffset);
                                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
                            })()}
                        </span>
                        <button
                            onClick={() => setDayOffset(prev => prev + 1)}
                            className="p-2 border border-[var(--border-subtle)] bg-[#111] hover:bg-white/5 rounded-lg text-white transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Grid Container */}
            <div className="w-full overflow-x-auto pb-8 custom-scrollbar">
                <div className={`min-w-[600px] bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden ${viewMode === 'weekly' ? 'min-w-[1400px]' : ''} ${viewMode === 'monthly' ? 'min-w-[1000px]' : ''}`}>

                    {/* Header Row */}
                    <div className="flex border-b border-[var(--border-subtle)] bg-[#111]">
                        <div className="w-56 shrink-0 p-4 border-r border-[var(--border-subtle)] font-bold text-sm text-[var(--text-secondary)] flex items-center bg-[#111] sticky left-0 z-20">
                            Team Member
                        </div>
                        <div className="flex-1 flex">
                            {dates.map(dateStr => {
                                const { dayName, dayNum, fullDate } = getDayHeader(dateStr);
                                const isWeekend = dayName === 'Sat' || dayName === 'Sun';
                                const isToday = dateStr === new Date().toISOString().split('T')[0];

                                return (
                                    <div key={dateStr} className={`flex-1 border-r border-[var(--border-subtle)] last:border-0 flex flex-col items-center justify-center py-2 ${viewMode === 'monthly' ? 'min-w-[40px]' : 'min-w-[160px]'} ${isWeekend ? 'bg-white/5' : ''} ${isToday ? 'bg-indigo-500/10' : ''}`}>
                                        <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isWeekend ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'} ${isToday ? 'text-indigo-400' : ''}`}>
                                            {dayName}
                                        </div>
                                        <div className={`font-mono ${viewMode !== 'monthly' ? 'text-lg' : 'text-sm'} ${isToday ? 'text-indigo-400 font-bold' : 'text-white'}`}>
                                            {dayNum}
                                        </div>
                                        {viewMode !== 'monthly' && (
                                            <div className="text-[10px] text-[var(--text-tertiary)] mt-1">
                                                {fullDate}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Member Rows */}
                    <div className="divide-y divide-[var(--border-subtle)]">
                        {members?.map((member: any) => (
                            <div key={member.id} className="flex hover:bg-white/[0.02] transition-colors group">
                                <div className="w-56 shrink-0 p-4 border-r border-[var(--border-subtle)] flex items-center gap-3 bg-[#0A0A0A] sticky left-0 z-10 group-hover:bg-white/[0.02]">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0" style={{ backgroundColor: member.color + '40', color: member.color, border: `1px solid ${member.color}60` }}>
                                        {member.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="truncate">
                                        <div className="font-bold text-sm text-white truncate">{member.name}</div>
                                        <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider truncate">{member.role}</div>
                                    </div>
                                </div>

                                <div className="flex-1 flex">
                                    {dates.map(dateStr => {
                                        const dayData = workload?.[member.id]?.[dateStr] || { shoots: [], tasks: [], score: 0 };
                                        const hasItems = dayData.shoots.length > 0 || dayData.tasks.length > 0;
                                        const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;

                                        if (viewMode === 'monthly') {
                                            // Monthly Heatmap Cell
                                            return (
                                                <div key={dateStr} className={`flex-1 min-w-[40px] border-r border-[var(--border-subtle)] last:border-0 p-1 flex items-center justify-center relative group/cell ${isWeekend ? 'bg-white/[0.02]' : ''}`}>
                                                    <div className={`w-full h-full min-h-[32px] rounded border transition-colors flex items-center justify-center ${getScoreColor(dayData.score)}`}>
                                                        {dayData.score > 0 && <span className="text-[10px] font-mono font-bold">{dayData.score}</span>}
                                                    </div>

                                                    {/* Tooltip */}
                                                    {hasItems && (
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#111] border border-[var(--border-subtle)] rounded-lg shadow-xl p-3 opacity-0 pointer-events-none group-hover/cell:opacity-100 group-hover/cell:pointer-events-auto transition-opacity z-50">
                                                            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 border-b border-[var(--border-subtle)] pb-1">
                                                                {new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                            </div>
                                                            {dayData.shoots.length > 0 && (
                                                                <div className="mb-2">
                                                                    <div className="text-[10px] text-indigo-400 font-bold mb-1 flex items-center gap-1">
                                                                        <CalendarIcon size={10} /> Shoots ({dayData.shoots.length})
                                                                    </div>
                                                                    {dayData.shoots.map((s: any, i: number) => (
                                                                        <div key={`s-${i}`} className="text-xs text-white truncate">• {s.title}</div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {dayData.tasks.length > 0 && (
                                                                <div>
                                                                    <div className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center gap-1">
                                                                        <CheckSquare size={10} /> Tasks Due ({dayData.tasks.length})
                                                                    </div>
                                                                    {dayData.tasks.map((t: any, i: number) => (
                                                                        <div key={`t-${i}`} className="text-xs text-white truncate">• {t.title}</div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        // Weekly and Daily Detailed Cell
                                        return (
                                            <div key={dateStr} className={`flex-1 min-w-[160px] border-r border-[var(--border-subtle)] last:border-0 flex flex-col ${isWeekend ? 'bg-white/[0.02]' : ''}`}>
                                                {!hasItems ? (
                                                    <div className="flex-1 flex items-center justify-center hover:bg-white/[0.02] p-2 transition-colors">
                                                        <span className="text-transparent group-hover:text-[var(--border-subtle)] transition-colors text-xl font-bold">+</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 flex flex-col h-full bg-[#111]/50 border-t-0 p-0 m-1 rounded-lg border border-[var(--border-subtle)] overflow-hidden">
                                                        <div className={`px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider border-b ${getHeaderColor(dayData.score)}`}>
                                                            <span>Load: {dayData.score}</span>
                                                        </div>
                                                        <div className="p-2 space-y-2 text-xs flex-1 overflow-y-auto max-h-[150px] custom-scrollbar bg-[#0A0A0A]">
                                                            {dayData.shoots.map((s: any, i: number) => (
                                                                <div key={`s-${i}`} className="flex items-start gap-1.5 p-1.5 rounded bg-indigo-500/10 text-indigo-200 border border-indigo-500/20">
                                                                    <CalendarIcon size={12} className="shrink-0 mt-0.5 text-indigo-400" />
                                                                    <div className="leading-tight">
                                                                        <span className="font-bold block">{s.title}</span>
                                                                        <span className="text-[10px] opacity-70">Shoot</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {dayData.tasks.map((t: any, i: number) => (
                                                                <div key={`t-${i}`} className="flex items-start gap-1.5 p-1.5 rounded bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">
                                                                    <CheckSquare size={12} className="shrink-0 mt-0.5 text-emerald-400" />
                                                                    <div className="leading-tight">
                                                                        <span className="font-bold block">{t.title}</span>
                                                                        <span className="text-[10px] opacity-70">Task</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend - Only show in Monthly view where it's needed */}
            {viewMode === 'monthly' && (
                <div className="max-w-[1400px] mt-6 flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <div className="w-4 h-4 rounded border bg-[#111] border-[var(--border-subtle)]" /> Free
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <div className="w-4 h-4 rounded border bg-emerald-500/20 border-emerald-500/30" /> Light
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <div className="w-4 h-4 rounded border bg-indigo-500/30 border-indigo-500/40" /> Medium
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <div className="w-4 h-4 rounded border bg-orange-500/30 border-orange-500/40" /> Heavy
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <div className="w-4 h-4 rounded border bg-red-500/30 border-red-500/40" /> Overloaded
                    </div>
                </div>
            )}
        </div>
    );
}
