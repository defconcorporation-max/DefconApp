'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Shoot, TeamMember, ShootAssignment } from '@/types';
import { Video, Calendar, ArrowRight, ExternalLink, Filter, ArrowUpDown, Clock } from 'lucide-react';
import ShootAssignmentWidget from '@/components/ShootAssignmentWidget';

interface EnhancedShoot extends Shoot {
    client_name: string;
    client_id: number;
    agency_name?: string;
    agency_color?: string;
    post_prod_status?: string;
    post_prod_id?: number;
    project_title?: string;
    project_id?: number;
}

interface ShootListProps {
    shoots: EnhancedShoot[];
    teamMembers: TeamMember[];
    allAssignments: ShootAssignment[];
}

type SortOption = 'date' | 'dueDate' | 'agency' | 'status' | 'client';
type SortOrder = 'asc' | 'desc';

export default function ShootList({ shoots, teamMembers, allAssignments }: ShootListProps) {
    const [sortBy, setSortBy] = useState<SortOption>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc'); // Default Date ASC for calendar feel
    const [filterStatus, setFilterStatus] = useState<string>('All');

    const filteredAndSortedShoots = useMemo(() => {
        let result = [...shoots];

        // Filter
        if (filterStatus !== 'All') {
            result = result.filter(s => s.status === filterStatus);
        }

        // Sort
        result.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (sortBy) {
                case 'date':
                    valA = new Date(a.shoot_date).getTime();
                    valB = new Date(b.shoot_date).getTime();
                    break;
                case 'dueDate':
                    valA = a.due_date ? new Date(a.due_date).getTime() : (sortOrder === 'asc' ? 9999999999999 : 0);
                    valB = b.due_date ? new Date(b.due_date).getTime() : (sortOrder === 'asc' ? 9999999999999 : 0);
                    break;
                case 'agency':
                    valA = a.agency_name || '';
                    valB = b.agency_name || '';
                    break;
                case 'status':
                    valA = a.status;
                    valB = b.status;
                    break;
                case 'client':
                    valA = a.client_name;
                    valB = b.client_name;
                    break;
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [shoots, sortBy, sortOrder, filterStatus]);

    const toggleSort = (option: SortOption) => {
        if (sortBy === option) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(option);
            setSortOrder('asc'); // Default to ASC for dates usually
        }
    };

    // Grouping Logic (Optional: Only if sorted by Date? For now, list view might be better)
    // Actually, user liked the Month grouping.
    // Let's keep Month grouping IF sorted by Date. If sorted by other things, just list them.
    const isSortedByDate = sortBy === 'date';

    const groupedShoots = useMemo(() => {
        if (!isSortedByDate) return { 'All': filteredAndSortedShoots };

        const groups: Record<string, EnhancedShoot[]> = {};
        filteredAndSortedShoots.forEach(shoot => {
            const date = new Date(shoot.shoot_date);
            const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push(shoot);
        });
        return groups;
    }, [filteredAndSortedShoots, isSortedByDate]);

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4 mb-6 bg-[#0A0A0A] border border-[var(--border-subtle)] p-3 rounded-lg sticky top-20 z-20 shadow-xl">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Filter size={16} />
                    <span>Filter:</span>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-black border border-[var(--border-subtle)] rounded px-2 py-1 text-white text-xs outline-none focus:border-violet-500"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                <div className="h-4 w-px bg-[var(--border-subtle)] mx-2 hidden sm:block"></div>

                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] flex-1 overflow-x-auto">
                    <ArrowUpDown size={16} />
                    <span>Sort by:</span>
                    <div className="flex gap-1">
                        {[
                            { id: 'date', label: 'Date' },
                            { id: 'dueDate', label: 'Due Date' },
                            { id: 'agency', label: 'Agency' },
                            { id: 'client', label: 'Client' },
                            { id: 'status', label: 'Status' }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => toggleSort(opt.id as SortOption)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${sortBy === opt.id
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {opt.label}
                                {sortBy === opt.id && (
                                    <span className="ml-1 opacity-70">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            {Object.entries(groupedShoots).map(([groupTitle, groupShoots]) => (
                <div key={groupTitle} className="mb-12">
                    {/* Show Header only if Date sorting (Month groups) or if distinct groups exist */}
                    {isSortedByDate && (
                        <h2 className="text-lg font-bold text-white mb-6 border-l-4 border-violet-500 pl-4 uppercase tracking-wider sticky top-36 bg-[var(--bg-root)] py-2 z-10 backdrop-blur-md bg-opacity-80">
                            {groupTitle}
                        </h2>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupShoots.map(shoot => {
                            const assignments = allAssignments.filter(a => a.shoot_id === shoot.id);
                            return (
                                <div key={shoot.id} className={`pro-card p-6 h-full transition-all duration-300 relative group flex flex-col ${shoot.post_prod_status ? 'border-orange-500/30 bg-orange-500/5' : 'hover:border-violet-500/30'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col items-center bg-white/5 px-3 py-1 rounded border border-white/5 min-w-[60px] group-hover:bg-violet-500/10 group-hover:border-violet-500/20 group-hover:text-violet-400 transition-colors">
                                            <span className="text-xs text-gray-500 uppercase group-hover:text-violet-400/70">{new Date(shoot.shoot_date).toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-xl font-bold">{new Date(shoot.shoot_date).getDate()}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {/* Agency Badge */}
                                            {shoot.agency_name && (
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border mb-1"
                                                    style={{
                                                        backgroundColor: `${shoot.agency_color}20`,
                                                        color: shoot.agency_color,
                                                        borderColor: `${shoot.agency_color}30`
                                                    }}
                                                >
                                                    {shoot.agency_name}
                                                </span>
                                            )}

                                            {/* Standard Status */}
                                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${shoot.status === 'Completed'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                }`}>
                                                {shoot.status}
                                            </div>
                                            {/* Post Prod Status Badge */}
                                            {shoot.post_prod_status && (
                                                <div className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border bg-orange-500/10 text-orange-400 border-orange-500/20 flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-orange-400 animate-pulse"></span>
                                                    PP: {shoot.post_prod_status}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Link href={shoot.post_prod_id ? `/post-production/${shoot.post_prod_id}` : `/shoots/${shoot.id}`} className="block">
                                        <h3 className="text-lg font-bold text-white mb-1 hover:text-violet-400 transition-colors flex items-center gap-2">
                                            {shoot.title}
                                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity translate-y-0.5" />
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-[var(--text-tertiary)] mb-4 flex items-center gap-2 flex-wrap">
                                        For: <Link href={`/clients/${shoot.client_id}`} className="text-[var(--text-secondary)] hover:text-white transition-colors">{shoot.client_name}</Link>
                                        {shoot.project_title && (
                                            <>
                                                <span className="text-[var(--text-tertiary)] opacity-50">•</span>
                                                <Link href={`/projects/${shoot.project_id}`} className="text-[var(--text-secondary)] hover:text-violet-400 transition-colors bg-violet-500/10 px-1.5 rounded truncate max-w-[150px]">
                                                    {shoot.project_title}
                                                </Link>
                                            </>
                                        )}
                                    </p>

                                    {/* Crew Widget */}
                                    <div className="mb-4">
                                        <ShootAssignmentWidget
                                            shootId={shoot.id}
                                            assignments={assignments}
                                            teamMembers={teamMembers}
                                        />
                                    </div>

                                    <div className="pt-4 mt-auto border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[var(--text-tertiary)] flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(shoot.shoot_date).toLocaleDateString()}
                                            </span>
                                            {shoot.due_date && (
                                                <span className="text-red-400 flex items-center gap-1 font-medium">
                                                    <Clock size={12} />
                                                    Due: {new Date(shoot.due_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <Link
                                            href={shoot.post_prod_id ? `/post-production/${shoot.post_prod_id}` : `/shoots/${shoot.id}`}
                                            className={`flex items-center gap-1 font-medium hover:gap-2 transition-all ${shoot.post_prod_id ? 'text-orange-400' : 'text-violet-400'}`}
                                        >
                                            {shoot.post_prod_id ? 'View Post-Prod' : 'View Details'} <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Empty State */}
            {filteredAndSortedShoots.length === 0 && (
                <div className="py-20 text-center border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)]/50">
                    <Video className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-white mb-2">No Shoots Matching Filters</h3>
                    <p className="text-[var(--text-tertiary)] text-sm mb-6">Try adjusting your filters or sort options.</p>
                </div>
            )}
        </div>
    );
}
