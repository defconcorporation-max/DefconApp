'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { Clock, Hash, DollarSign, ArrowUpDown, Filter } from 'lucide-react';

interface EnhancedProject extends Project {
    client_name: string;
    client_contact: string;
    shoot_count: number;
    total_value: number;
    label_name?: string;
    label_color?: string;
}

interface ProjectListProps {
    projects: EnhancedProject[];
}

type SortOption = 'date' | 'dueDate' | 'label' | 'status' | 'client' | 'value';
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
                case 'label':
                    valA = a.label_name || '';
                    valB = b.label_name || '';
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

    const toggleSort = (option: SortOption) => {
        if (sortBy === option) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(option);
            setSortOrder('desc'); // Default to desc for most things
        }
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
                            { id: 'label', label: 'Label' },
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

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedProjects.map(project => (
                    <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group relative flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider mb-2 inline-block ${project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    project.status === 'Completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                        'bg-white/5 text-[var(--text-secondary)] border border-white/10'
                                }`}>
                                {project.status}
                            </span>
                            {project.label_name && (
                                <span
                                    className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border"
                                    style={{
                                        backgroundColor: `${project.label_color}20`,
                                        color: project.label_color,
                                        borderColor: `${project.label_color}30`
                                    }}
                                >
                                    {project.label_name}
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

                        <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">{project.client_name}</span>
                                <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Client</span>
                            </div>
                            <div className="text-right">
                                <div className="font-mono text-sm font-bold text-[var(--text-secondary)]">
                                    ${project.total_value.toLocaleString()}
                                </div>
                                <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{project.shoot_count} Shoots</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredAndSortedProjects.length === 0 && (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                    <p>No projects found matching filters.</p>
                </div>
            )}
        </div>
    );
}
