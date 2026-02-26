import { getTeamWorkload } from '@/app/scheduling-actions';
import Link from 'next/link';
import { ArrowLeft, Users, Calendar, CheckSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getScoreColor(score: number) {
    if (score === 0) return 'bg-[#111] border-[var(--border-subtle)]';
    if (score <= 1) return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
    if (score <= 3) return 'bg-indigo-500/30 border-indigo-500/40 text-indigo-300';
    if (score <= 5) return 'bg-orange-500/30 border-orange-500/40 text-orange-300';
    return 'bg-red-500/30 border-red-500/40 text-red-300';
}

function getDayHeader(dateStr: string) {
    const d = new Date(dateStr);
    return {
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate()
    };
}

export default async function TeamWorkloadPage() {
    const { members, workload, startDate, endDate, error } = await getTeamWorkload();

    if (error) {
        return <div className="p-8 text-red-500">Failed to load workload data: {error}</div>;
    }

    // Generate date sequence for headers
    const dates: string[] = [];
    if (startDate && endDate) {
        let curr = new Date(startDate);
        const end = new Date(endDate);
        while (curr <= end) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }
    }

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <header className="mb-8 max-w-[1400px]">
                <div className="flex justify-between items-center mb-4">
                    <Link href="/team" className="text-[var(--text-tertiary)] hover:text-white transition-colors flex items-center gap-2 text-sm font-mono">
                        <ArrowLeft size={16} /> Back to Team
                    </Link>
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Users className="text-indigo-400" />
                        Team Workload Heatmap
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">30-day forecast based on assigned shoots and tasks.</p>
                </div>
            </header>

            <div className="max-w-[1400px] overflow-x-auto pb-8 custom-scrollbar">
                <div className="min-w-[1000px] bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden">

                    {/* Header Row */}
                    <div className="flex border-b border-[var(--border-subtle)] bg-[#111]">
                        <div className="w-56 shrink-0 p-4 border-r border-[var(--border-subtle)] font-bold text-sm text-[var(--text-secondary)] flex items-center">
                            Team Member
                        </div>
                        <div className="flex-1 flex">
                            {dates.map(dateStr => {
                                const { dayName, dayNum } = getDayHeader(dateStr);
                                const isWeekend = dayName === 'Sat' || dayName === 'Sun';
                                const isToday = dateStr === startDate;

                                return (
                                    <div key={dateStr} className={`flex-1 min-w-[40px] border-r border-[var(--border-subtle)] last:border-0 flex flex-col items-center justify-center py-2 ${isWeekend ? 'bg-white/5' : ''} ${isToday ? 'bg-indigo-500/10' : ''}`}>
                                        <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isWeekend ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'} ${isToday ? 'text-indigo-400' : ''}`}>
                                            {dayName}
                                        </div>
                                        <div className={`text-sm font-mono ${isToday ? 'text-indigo-400 font-bold' : 'text-white'}`}>
                                            {dayNum}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Member Rows */}
                    <div className="divide-y divide-[var(--border-subtle)]">
                        {members?.map((member: any) => (
                            <div key={member.id} className="flex hover:bg-white/[0.02] transition-colors group">
                                <div className="w-56 shrink-0 p-4 border-r border-[var(--border-subtle)] flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: member.color + '40', color: member.color, border: `1px solid ${member.color}60` }}>
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
                                                                    <Calendar size={10} /> Shoots ({dayData.shoots.length})
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
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="max-w-[1400px] mt-6 flex gap-6 text-sm">
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

        </main>
    );
}
