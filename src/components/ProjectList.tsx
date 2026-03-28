'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { Clock, Filter, Search, SortDesc, ChevronDown, ChevronRight, Briefcase, ArrowUpDown, Hash, DollarSign, Receipt, Send, Check } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { syncProjectToExpenses } from '@/app/actions';

interface EnhancedProject extends Project {
    client_name: string;
    client_contact: string;
    shoot_count: number;
    shoots_scheduled: number;
    shoots_in_post_prod: number;
    shoots_done: number;
    total_value: number;
    agency_name?: string;
    agency_color?: string;
}

interface ProjectListProps {
    projects: EnhancedProject[];
}

type SortOption = 'date' | 'dueDate' | 'agency' | 'status' | 'client' | 'value';
type SortOrder = 'asc' | 'desc';

export default function ProjectList({ projects }: ProjectListProps) {
    const [sortBy, setSortBy] = useState<SortOption>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [syncingId, setSyncingId] = useState<number | null>(null);
    const [syncedId, setSyncedId] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const handleSendToExpenses = async (e: React.MouseEvent, projectId: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (syncingId) return;

        if (!confirm('Send this project total to Business Expenses?')) return;

        setSyncingId(projectId);
        try {
            const result = await syncProjectToExpenses(projectId);
            if (result.success) {
                setSyncedId(projectId);
                setTimeout(() => setSyncedId(null), 3000);
            } else {
                alert('Failed to sync: ' + result.error);
            }
        } catch (err) {
            alert('An error occurred during sync.');
        } finally {
            setSyncingId(null);
        }
    };

    const filteredAndSortedProjects = useMemo(() => {
        let result = [...projects];

        // Filter by Status
        if (filterStatus !== 'All') {
            result = result.filter(p => p.status === filterStatus);
        }

        // Search Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => 
                p.title.toLowerCase().includes(q) || 
                p.client_name.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (sortBy) {
                case 'date':
                    valA = new Date(a.created_at).getTime();
                    valB = new Date(b.created_at).getTime();
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
                case 'value':
                    valA = a.total_value;
                    valB = b.total_value;
                    break;
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [projects, sortBy, sortOrder, filterStatus, searchQuery]);

    const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

    const toggleSort = (option: SortOption) => {
        if (sortBy === option) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(option);
            setSortOrder('desc'); // Default to desc for most things
        }
    };

    const groupedProjects = useMemo(() => {
        const groups: Record<string, EnhancedProject[]> = {};
        filteredAndSortedProjects.forEach(project => {
            const date = new Date(project.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(project);
        });
        return groups;
    }, [filteredAndSortedProjects]);

    const sortedMonthKeys = Object.keys(groupedProjects).sort().reverse();

    useEffect(() => {
        setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    }, []);

    // Sur mobile, on évite de tout déplier (trop dense) et on garde un meilleur scroll.
    useEffect(() => {
        if (!isMobile) return;
        if (Object.keys(collapsedMonths).length > 0) return;
        const init: Record<string, boolean> = {};
        sortedMonthKeys.forEach((k) => {
            init[k] = true; // true => section collapsed
        });
        setCollapsedMonths(init);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMobile, sortedMonthKeys]);

    const toggleMonth = (key: string) => {
        setCollapsedMonths(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const formatMonthHeader = (key: string) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    return (
        <div>
            {/* Toolbar - Redesigned for Mobile */}
            <div className="flex flex-col gap-4 mb-8 bg-[#18181b]/60 backdrop-blur-2xl border border-white/5 p-4 rounded-3xl sticky top-4 z-30 shadow-2xl">
                {/* Mobile Header: Search + Filter Toggle */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-violet-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher projets..."
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
                <div className={`${showFilters ? 'flex' : 'hidden md:flex'} flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300`}>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Statut:</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-black/40 border border-white/5 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-violet-500/50"
                        >
                            <option value="All">Tous</option>
                            <option value="Active">Actifs</option>
                            <option value="Completed">Terminés</option>
                            <option value="Archived">Archivés</option>
                        </select>
                    </div>

                    <div className="h-4 w-px bg-white/5 mx-2 hidden md:block"></div>

                    <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)] whitespace-nowrap">Trier par:</span>
                        <div className="flex gap-2">
                            {[
                                { id: 'date', label: 'Création' },
                                { id: 'dueDate', label: 'Echéance' },
                                { id: 'client', label: 'Client' },
                                { id: 'value', label: 'Valeur' }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => toggleSort(opt.id as SortOption)}
                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${sortBy === opt.id
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
                    </div>
                </div>
            </div>

            {/* Grouped Month Sections */}
            <div className="space-y-8">
                {sortedMonthKeys.map(monthKey => (
                    <div key={monthKey} className="md:animate-in md:fade-in duration-500">
                        {/* Section Header */}
                        <button
                            onClick={() => toggleMonth(monthKey)}
                            className="flex items-center gap-3 w-full text-left mb-4 group"
                        >
                            <div className={`p-1 rounded text-[var(--text-secondary)] group-hover:bg-white/10 group-hover:text-white transition-colors`}>
                                {collapsedMonths[monthKey] ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                            </div>
                            <h2 className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors">
                                {formatMonthHeader(monthKey)}
                            </h2>
                            <span className="text-xs font-mono text-[var(--text-tertiary)] bg-white/5 px-2 py-0.5 rounded-full">
                                {groupedProjects[monthKey].length}
                            </span>
                            <div className="h-px bg-[var(--border-subtle)] flex-1 ml-4 group-hover:bg-violet-500/30 transition-colors"></div>
                        </button>

                        {/* Projects Grid */}
                        {!collapsedMonths[monthKey] && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-0 md:pl-2 md:border-l border-[var(--border-subtle)] md:ml-2.5">
                                {groupedProjects[monthKey].map(project => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="pro-card p-6 h-full transition-all group relative flex flex-col border-white/5 hover:border-violet-500/50 rounded-3xl overflow-hidden shadow-xl"
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                                project.status === 'Completed' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                                                    'bg-white/5 text-[var(--text-secondary)] border border-white/10'
                                                }`}>
                                                {project.status}
                                            </span>
                                            {project.agency_name && (
                                                <span
                                                    className="px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-widest border"
                                                    style={{
                                                        backgroundColor: `${project.agency_color}20`,
                                                        color: project.agency_color,
                                                        borderColor: `${project.agency_color}30`
                                                    }}
                                                >
                                                    {project.agency_name}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-lg text-white mb-1 group-hover:text-violet-400 transition-colors truncate pr-2">
                                            {project.title}
                                        </h3>

                                        {project.due_date && (
                                            <div className="text-xs text-red-400 mb-3 flex items-center gap-1.5 font-medium">
                                                <Clock size={12} />
                                                Due: {new Date(project.due_date).toLocaleDateString()}
                                            </div>
                                        )}
                                        {!project.due_date && <div className="mb-3 h-4"></div>} {/* Spacer */}

                                        <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-end justify-between gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-white">{project.client_name}</span>
                                                <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Client</span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 flex-1 max-w-[140px]">
                                                <div className="flex items-center gap-2 group/value">
                                                    <div className="font-mono text-sm font-bold text-[var(--text-secondary)]">
                                                        ${project.total_value.toLocaleString()}
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleSendToExpenses(e, project.id)}
                                                        title="Log as business expense"
                                                        className={`p-1.5 rounded-lg transition-all border ${syncedId === project.id
                                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                            : 'bg-white/5 text-[var(--text-tertiary)] hover:text-emerald-400 border-white/5 hover:border-emerald-500/30'
                                                            }`}
                                                        disabled={syncingId === project.id}
                                                    >
                                                        {syncingId === project.id ? (
                                                            <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                                        ) : syncedId === project.id ? (
                                                            <Check size={12} />
                                                        ) : (
                                                            <Receipt size={12} />
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Shoot Progress Bar Shortcut */}
                                                {project.shoot_count > 0 ? (
                                                    <Link
                                                        href={`/projects/${project.id}?tab=shoots`}
                                                        className="w-full flex flex-col gap-1 group/shoots hover:bg-white/5 p-1 -m-1 rounded transition-colors cursor-pointer"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="flex justify-between items-center mb-0.5 opacity-0 group-hover/shoots:opacity-100 transition-opacity absolute -top-4 right-0 bg-violet-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow">
                                                            View Shoots
                                                        </div>
                                                        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-white/10 group-hover/shoots:ring-1 ring-violet-500/50 transition-all">
                                                            {project.shoots_done > 0 && (
                                                                <div style={{ width: `${(project.shoots_done / project.shoot_count) * 100}%` }} className="bg-emerald-500" />
                                                            )}
                                                            {project.shoots_in_post_prod > 0 && (
                                                                <div style={{ width: `${(project.shoots_in_post_prod / project.shoot_count) * 100}%` }} className="bg-indigo-500" />
                                                            )}
                                                            {project.shoots_scheduled > 0 && (
                                                                <div style={{ width: `${(project.shoots_scheduled / project.shoot_count) * 100}%` }} className="bg-white/30" />
                                                            )}
                                                        </div>
                                                        <div className="flex justify-end gap-2 text-[9px] text-[var(--text-tertiary)] font-mono group-hover/shoots:text-[var(--text-secondary)] transition-colors">
                                                            {project.shoots_scheduled > 0 && <span>{project.shoots_scheduled} Sched</span>}
                                                            {project.shoots_in_post_prod > 0 && <span className="text-indigo-400">{project.shoots_in_post_prod} Post</span>}
                                                            {project.shoots_done > 0 && <span className="text-emerald-400">{project.shoots_done} Done</span>}
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">0 Shoots</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredAndSortedProjects.length === 0 && (
                <div className="py-12">
                    <EmptyState
                        icon={Briefcase}
                        title="No Projects Found"
                        description="There are no projects matching your current filters. Try changing your search or creating a new one."
                        actionLabel="Create Project"
                        onAction={() => {
                            if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('open-quick-create', { detail: 'project' }));
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}
