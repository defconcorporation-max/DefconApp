'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { Clock, Filter, Search, SortDesc, ChevronDown, ChevronRight, Briefcase, ArrowUpDown, Hash, DollarSign } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

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

    const filteredAndSortedProjects = useMemo(() => {
        let result = [...projects];

        // Filter
        if (filterStatus !== 'All') {
            result = result.filter(p => p.status === filterStatus);
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
                    // Handle missing due dates (push to end if sort asc, etc.)
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
    }, [projects, sortBy, sortOrder, filterStatus]);

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
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4 mb-6 bg-[#0A0A0A] border border-[var(--border-subtle)] p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Filter size={16} />
                    <span>Filter:</span>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-black border border-[var(--border-subtle)] rounded px-2 py-1 text-white text-xs outline-none focus:border-violet-500"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Archived">Archived</option>
                    </select>
                </div>

                <div className="h-4 w-px bg-[var(--border-subtle)] mx-2 hidden sm:block"></div>

                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] flex-1 overflow-x-auto">
                    <ArrowUpDown size={16} />
                    <span>Sort by:</span>
                    <div className="flex gap-1">
                        {[
                            { id: 'date', label: 'Created' },
                            { id: 'dueDate', label: 'Due Date' },
                            { id: 'agency', label: 'Agency' },
                            { id: 'client', label: 'Client' },
                            { id: 'value', label: 'Value' }
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

            {/* Grouped Month Sections */}
            <div className="space-y-8">
                {sortedMonthKeys.map(monthKey => (
                    <div key={monthKey} className="animate-in fade-in duration-500">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-2 border-l border-[var(--border-subtle)] ml-2.5">
                                {groupedProjects[monthKey].map(project => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group relative flex flex-col hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10 duration-300"
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider mb-2 inline-block ${project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                project.status === 'Completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    'bg-white/5 text-[var(--text-secondary)] border border-white/10'
                                                }`}>
                                                {project.status}
                                            </span>
                                            {project.agency_name && (
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border"
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
                                                <div className="font-mono text-sm font-bold text-[var(--text-secondary)]">
                                                    ${project.total_value.toLocaleString()}
                                                </div>

                                                {/* Shoot Progress Bar */}
                                                {project.shoot_count > 0 ? (
                                                    <div className="w-full flex flex-col gap-1">
                                                        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-white/10">
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
                                                        <div className="flex justify-end gap-2 text-[9px] text-[var(--text-tertiary)] font-mono">
                                                            {project.shoots_scheduled > 0 && <span>{project.shoots_scheduled} Sched</span>}
                                                            {project.shoots_in_post_prod > 0 && <span className="text-indigo-400">{project.shoots_in_post_prod} Post</span>}
                                                            {project.shoots_done > 0 && <span className="text-emerald-400">{project.shoots_done} Done</span>}
                                                        </div>
                                                    </div>
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
                        onAction={() => window.dispatchEvent(new CustomEvent('open-quick-create', { detail: 'project' }))}
                    />
                </div>
            )}
        </div>
    );
}
