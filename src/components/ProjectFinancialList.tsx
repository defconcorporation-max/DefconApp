
'use client';

import { useState } from 'react';
import { ArrowUpRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import PaymentModal from './PaymentModal';

export default function ProjectFinancialList({ projects }: { projects: any[] }) {
    const [selectedProject, setSelectedProject] = useState<any>(null);

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
            {selectedProject && (
                <PaymentModal
                    project={selectedProject}
                    clientId={selectedProject.client_id}
                    balance={selectedProject.total_value - (selectedProject.paid_amount || 0)}
                    onClose={() => setSelectedProject(null)}
                />
            )}

            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">Project Financials</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-[var(--text-tertiary)] uppercase text-xs font-medium">
                        <tr>
                            <th className="px-6 py-4">Project</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Total (Inc. Tax)</th>
                            <th className="px-6 py-4 text-right">Paid</th>
                            <th className="px-6 py-4 text-right">Balance</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                        {projects.map((project: any) => {
                            const total = project.total_value || 0;
                            const paid = project.paid_amount || 0;
                            const balance = total - paid;
                            const isPaidOff = balance <= 0.01 && total > 0;

                            return (
                                <tr key={project.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <Link href={`/projects/${project.id}`} className="font-medium text-white hover:text-violet-400 transition-colors flex items-center gap-1 group">
                                            {project.title}
                                            <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                        <div className="text-xs text-[var(--text-secondary)]">{project.client_company}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${isPaidOff ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                project.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                    project.status === 'Archived' ? 'bg-gray-500/10 border-gray-500/20 text-gray-400' :
                                                        'bg-violet-500/10 border-violet-500/20 text-violet-400'
                                            }`}>
                                            {isPaidOff ? 'Paid Off' : (project.status || 'Active')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-white">
                                        ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-emerald-400">
                                        ${paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-[var(--text-tertiary)]">
                                        ${balance > 0 ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {balance > 0.01 && (
                                            <button
                                                onClick={() => setSelectedProject(project)}
                                                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded flex items-center gap-1 ml-auto transition-colors"
                                            >
                                                <PlusCircle size={14} />
                                                Pay
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
