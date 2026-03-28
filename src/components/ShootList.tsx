'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Shoot, TeamMember, ShootAssignment } from '@/types';
import { Video, Calendar, ArrowRight, ExternalLink, Filter, ArrowUpDown, Clock, Users, Search, CalendarRange } from 'lucide-react';
import ShootAssignmentWidget from '@/components/ShootAssignmentWidget';
import { dateKeyFromStored, parseDateOnlyLocal } from '@/lib/date-local';

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
    const [filterProject, setFilterProject] = useState<string>('All');
    const [filterDateFrom, setFilterDateFrom] = useState<string>('');
    const [filterDateTo, setFilterDateTo] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [expandedShootId, setExpandedShootId] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Extract unique project titles for filter dropdown
    const uniqueProjects = useMemo(() => {
        const projects = new Set<string>();
        shoots.forEach(s => { if (s.project_title) projects.add(s.project_title); });
        return Array.from(projects).sort();
    }, [shoots]);

    const filteredAndSortedShoots = useMemo(() => {
        let result = [...shoots];

        // Filter by status
        if (filterStatus !== 'All') {
            result = result.filter(s => s.status === filterStatus);
        }

        // Filter by project
        if (filterProject !== 'All') {
            result = result.filter(s => s.project_title === filterProject);
        }

        // Filter by date range
        if (filterDateFrom) {
            result = result.filter(s => s.shoot_date >= filterDateFrom);
        }
        if (filterDateTo) {
            result = result.filter(s => s.shoot_date <= filterDateTo);
        }

        // Filter by search query (client name or shoot title)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.client_name?.toLowerCase().includes(q) ||
                s.title?.toLowerCase().includes(q) ||
                s.project_title?.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (sortBy) {
                case 'date':
                    valA = dateKeyFromStored(a.shoot_date);
                    valB = dateKeyFromStored(b.shoot_date);
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
    }, [shoots, sortBy, sortOrder, filterStatus, filterProject, filterDateFrom, filterDateTo, searchQuery]);

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
            const date = parseDateOnlyLocal(shoot.shoot_date);
            const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push(shoot);
        });
        return groups;
    }, [filteredAndSortedShoots, isSortedByDate]);

    const assignmentsByShootId = useMemo(() => {
        const map: Record<number, ShootAssignment[]> = {};
        for (const assignment of allAssignments) {
            if (!map[assignment.shoot_id]) map[assignment.shoot_id] = [];
            map[assignment.shoot_id].push(assignment);
        }
        return map;
    }, [allAssignments]);

    const hasActiveFilters = filterStatus !== 'All' || filterProject !== 'All' || filterDateFrom || filterDateTo || searchQuery;

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-col gap-4 mb-8 bg-[#18181b]/60 backdrop-blur-2xl border border-white/5 p-4 rounded-3xl sticky top-4 z-30 shadow-2xl">
                {/* Mobile Header: Search + Filter Toggle */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-violet-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-violet-500/50 focus:bg-black/60 transition-all placeholder:text-[var(--text-tertiary)]"
                        />
                    </div>
                    
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`md:hidden p-2.5 rounded-2xl border transition-all ${showFilters ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' : 'bg-white/5 border-white/5 text-[var(--text-tertiary)]'}`}
                    >
                        <Filter size={20} />
                    </button>
                </div>

                {/* Desktop Filters / Mobile Collapsible Filters */}
                <div className={`${showFilters ? 'flex' : 'hidden md:flex'} flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-violet-500/50"
                        >
                            <option value="All">Tous les statuts</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    {uniqueProjects.length > 0 && (
                        <select
                            value={filterProject}
                            onChange={(e) => setFilterProject(e.target.value)}
                            className="bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-violet-500/50 max-w-[180px] truncate"
                        >
                            <option value="All">Tous les projets</option>
                            {uniqueProjects.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    )}

                    {/* Date range */}
                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl px-2 py-1">
                        <CalendarRange size={14} className="text-[var(--text-tertiary)]" />
                        <input
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => setFilterDateFrom(e.target.value)}
                            className="bg-transparent border-none p-0 text-white text-[10px] outline-none w-[90px]"
                        />
                        <span className="text-[var(--text-tertiary)]">→</span>
                        <input
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => setFilterDateTo(e.target.value)}
                            className="bg-transparent border-none p-0 text-white text-[10px] outline-none w-[90px]"
                        />
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={() => { setFilterStatus('All'); setFilterProject('All'); setFilterDateFrom(''); setFilterDateTo(''); setSearchQuery(''); }}
                            className="text-[10px] text-red-400 font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest whitespace-nowrap">
                        <ArrowUpDown size={14} />
                        Tri:
                    </div>
                    <div className="flex gap-2">
                        {[
                            { id: 'date', label: 'Date' },
                            { id: 'status', label: 'Statut' },
                            { id: 'client', label: 'Client' }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => toggleSort(opt.id as SortOption)}
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${sortBy === opt.id
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                    : 'bg-white/5 text-[var(--text-tertiary)] hover:bg-white/10 hover:text-white border border-white/5'
                                    }`}
                            >
                                {opt.label}
                                {sortBy === opt.id && (
                                    <span className="ml-1.5">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <span className="ml-auto text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest whitespace-nowrap">
                        {filteredAndSortedShoots.length} Résultat{filteredAndSortedShoots.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* List */}
            {Object.entries(groupedShoots).map(([groupTitle, groupShoots]) => (
                <div key={groupTitle} className="mb-12">
                    {/* Show Header only if Date sorting (Month groups) or if distinct groups exist */}
                    {isSortedByDate && (
                        <h2 className="text-lg font-bold text-white mb-6 border-l-4 border-violet-500 pl-4 uppercase tracking-wider md:sticky top-36 bg-[var(--bg-root)] py-2 z-10 backdrop-blur-md bg-opacity-80">
                            {groupTitle}
                        </h2>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupShoots.map(shoot => {
                            const assignments = assignmentsByShootId[shoot.id] ?? [];
                            return (
                                <div key={shoot.id} className={`pro-card p-6 h-full relative group flex flex-col ${shoot.post_prod_status ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5 hover:border-violet-500/50'} transition-all duration-500 rounded-3xl overflow-hidden shadow-xl`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex flex-col items-center bg-white/5 px-4 py-2 rounded-2xl border border-white/5 min-w-[70px] group-hover:bg-violet-500/20 group-hover:border-violet-500/30 group-hover:text-violet-400 transition-all duration-300 shadow-inner">
                                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest group-hover:text-violet-300">{parseDateOnlyLocal(shoot.shoot_date).toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-2xl font-black">{parseDateOnlyLocal(shoot.shoot_date).getDate()}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {/* Agency Badge */}
                                            {shoot.agency_name && (
                                                <span
                                                    className="px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-widest border"
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
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${shoot.status === 'Completed'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                                }`}>
                                                {shoot.status}
                                            </div>
                                            {/* Post Prod Status Badge */}
                                            {shoot.post_prod_status && (
                                                <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-amber-500/20 text-amber-400 border-amber-500/30 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
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
                                        <button
                                            type="button"
                                            onClick={() => setExpandedShootId((prev) => (prev === shoot.id ? null : shoot.id))}
                                            className="w-full flex items-center justify-between gap-3 text-left px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/40 hover:bg-[var(--bg-surface-hover)] transition-colors"
                                        >
                                            <span className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                                                <Users size={14} />
                                                Crew
                                                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                                                    {assignments.length}
                                                </span>
                                            </span>
                                            <span className="text-[10px] text-[var(--text-tertiary)]">
                                                {expandedShootId === shoot.id ? 'Masquer' : 'Gérer'}
                                            </span>
                                        </button>
                                        {expandedShootId === shoot.id && (
                                            <div className="mt-3">
                                                <ShootAssignmentWidget
                                                    shootId={shoot.id}
                                                    assignments={assignments}
                                                    teamMembers={teamMembers}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 mt-auto border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[var(--text-tertiary)] flex items-center gap-1">
                                                <Calendar size={12} />
                                                {parseDateOnlyLocal(shoot.shoot_date).toLocaleDateString()}
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
