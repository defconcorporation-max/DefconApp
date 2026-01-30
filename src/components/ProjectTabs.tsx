'use client';

import { useState } from 'react';
import { LayoutDashboard, CheckSquare, Video, DollarSign, Calendar, ArrowUpRight, Clock, Trash2 } from 'lucide-react';
import { Project, Shoot, ProjectService, Commission, Client, ProjectTask, TaskStage, Service, Settings, TeamMember } from '@/types';
import ShootManager from '@/components/ShootManager';
import ProjectTaskManager from '@/components/ProjectTaskManager';
import { DynamicInvoiceButton as InvoiceButton } from '@/components/InvoiceHelpers';
import CommissionCalculator from '@/components/CommissionCalculator';
import StatusSelector from '@/components/ProjectStatusSelect';
import { addProjectService, deleteProjectService, updateProjectDetails } from '@/app/actions';
import ClientLabelSelect from './ClientLabelSelect';

interface ProjectTabsProps {
    project: Project;
    client: Client;
    shoots: Shoot[];
    projectServices: ProjectService[];
    catalogServices: Service[];
    commissions: Commission[];
    settings: Settings;
    teamMembers: TeamMember[];
    tasks: ProjectTask[];
    stages: TaskStage[];
    videosMap: Record<number, any[]>;
    totalValue: number;
    projectLabels: { id: number, name: string, color: string }[];
}

export default function ProjectTabs({
    project,
    client,
    shoots,
    projectServices,
    catalogServices,
    commissions,
    settings,
    teamMembers,
    tasks,
    stages,
    videosMap,
    totalValue,
    projectLabels
}: ProjectTabsProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditingDetails, setIsEditingDetails] = useState(false);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
        { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={16} /> },
        { id: 'financials', label: 'Financials', icon: <DollarSign size={16} /> },
    ];

    // Calculate Completion for Overview
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.is_completed).length;
    const taskProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return (
        <div>
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 bg-black/20 p-1 rounded-xl w-fit border border-[var(--border-subtle)]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                            ${activeTab === tab.id
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                : 'text-[var(--text-tertiary)] hover:text-white hover:bg-white/5'}
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Status Card */}
                            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl relative group">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Project Status</h3>
                                    <button
                                        onClick={() => setIsEditingDetails(!isEditingDetails)}
                                        className="text-xs text-violet-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        {isEditingDetails ? 'Cancel' : 'Edit Details'}
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <StatusSelector projectId={project.id} currentStatus={project.status} />
                                </div>

                                {isEditingDetails ? (
                                    <form action={async (formData) => {
                                        await updateProjectDetails(formData);
                                        setIsEditingDetails(false);
                                    }} className="space-y-4 border-t border-[var(--border-subtle)] pt-4 mb-4">
                                        <input type="hidden" name="projectId" value={project.id} />

                                        <div>
                                            <label className="block text-xs text-[var(--text-secondary)] mb-1">Due Date</label>
                                            <input
                                                type="date"
                                                name="dueDate"
                                                defaultValue={project.due_date ? new Date(project.due_date).toISOString().split('T')[0] : ''}
                                                className="w-full bg-black border border-[var(--border-subtle)] rounded px-2 py-1.5 text-xs text-white focus:border-violet-500 outline-none color-scheme-dark"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-[var(--text-secondary)] mb-1">Label</label>
                                            <ClientLabelSelect
                                                defaultValue={project.label_id || ''}
                                                labels={projectLabels}
                                            />
                                        </div>

                                        <button className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-2 rounded transition-colors">
                                            Save Changes
                                        </button>
                                    </form>
                                ) : (
                                    <div className="space-y-2 mb-4 border-t border-[var(--border-subtle)] pt-4">
                                        {project.due_date && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-[var(--text-tertiary)]">Due Date</span>
                                                <span className="text-red-400 font-medium">{new Date(project.due_date).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {project.label_name && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-[var(--text-tertiary)]">Label</span>
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-xs font-medium border"
                                                    style={{
                                                        backgroundColor: `${project.label_color}20`,
                                                        color: project.label_color,
                                                        borderColor: `${project.label_color}30`
                                                    }}
                                                >
                                                    {project.label_name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm border-t border-[var(--border-subtle)] pt-4">
                                    <span className="text-[var(--text-tertiary)]">Created</span>
                                    <span className="font-mono">{new Date(project.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Progress Card */}
                            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl">
                                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Deliverables Progress</h3>
                                <div className="text-4xl font-bold mb-2 font-mono flex items-end gap-2">
                                    {taskProgress}%
                                    <span className="text-sm font-normal text-[var(--text-tertiary)] mb-1.5">completed</span>
                                </div>
                                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${taskProgress}%` }}></div>
                                </div>
                                <div className="mt-4 text-xs text-[var(--text-tertiary)] flex justify-between">
                                    <span>{completedTasks} done</span>
                                    <span>{totalTasks - completedTasks} remaining</span>
                                </div>
                            </div>

                            {/* Financial Summary (Moved from Financials tab to be visible here? No, keep focused. Maybe a mini stat?) */}
                            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl flex flex-col justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Financial Overview</h3>
                                    <div className="text-3xl font-bold text-white mb-1 font-mono">${totalValue.toLocaleString()}</div>
                                    <div className="text-xs text-[var(--text-tertiary)]">Total Project Value</div>
                                </div>
                                <button
                                    onClick={() => setActiveTab('financials')}
                                    className="w-full mt-4 py-2 rounded bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors text-[var(--text-secondary)]"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>

                        {/* Merged Schedule Section */}
                        <div className="border-t border-[var(--border-subtle)] pt-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Video className="text-violet-500" />
                                Shoot Schedule
                            </h2>
                            <ShootManager clientId={project.client_id} shoots={shoots} videosMap={videosMap} projectId={project.id} />
                        </div>
                    </div>
                )}

                {/* --- FINANCIALS TAB --- */}
                {activeTab === 'financials' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Services & Billing */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-white/5">
                                    <h3 className="font-bold flex items-center gap-2 text-sm"><DollarSign size={16} className="text-emerald-400" /> Billable Services</h3>
                                    <InvoiceButton
                                        project={project}
                                        client={client}
                                        services={projectServices}
                                        settings={settings}
                                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors"
                                    />
                                </div>
                                <div className="divide-y divide-[var(--border-subtle)]">
                                    {projectServices.map(service => (
                                        <div key={service.id} className="p-4 flex justify-between items-center group hover:bg-white/5 transition-colors">
                                            <div>
                                                <div className="font-medium text-sm">{service.name}</div>
                                                <div className="text-xs text-[var(--text-tertiary)]">
                                                    ${service.rate} x {service.quantity}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono text-sm">${service.rate * service.quantity}</span>
                                                <form action={deleteProjectService}>
                                                    <input type="hidden" name="id" value={service.id} />
                                                    <input type="hidden" name="projectId" value={project.id} />
                                                    <button className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    ))}
                                    {projectServices.length === 0 && (
                                        <div className="p-8 text-center text-xs text-gray-500 italic">No services added.</div>
                                    )}
                                </div>

                                {/* Add Service Form */}
                                <div className="p-4 bg-white/5 border-t border-[var(--border-subtle)]">
                                    <h4 className="text-xs font-bold uppercase text-[var(--text-tertiary)] mb-3">Add Service</h4>
                                    <form action={addProjectService} className="space-y-3">
                                        <input type="hidden" name="projectId" value={project.id} />

                                        {/* Quick Catalog Select */}
                                        {catalogServices.length > 0 && (
                                            <select name="serviceId" className="w-full bg-black border border-[var(--border-subtle)] rounded px-2 py-1.5 text-xs text-gray-300 focus:border-violet-500 outline-none mb-2">
                                                <option value="">-- Select from Catalog --</option>
                                                {catalogServices.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} (${s.default_rate})</option>
                                                ))}
                                            </select>
                                        )}

                                        <div className="flex gap-2">
                                            <input name="name" placeholder="Name / Custom Item" className="bg-black border border-[var(--border-subtle)] rounded px-2 py-1.5 text-xs flex-1 focus:border-violet-500 outline-none" required />
                                            <input name="quantity" type="number" placeholder="Qty" defaultValue="1" className="bg-black border border-[var(--border-subtle)] rounded px-2 py-1.5 text-xs w-16 focus:border-violet-500 outline-none" />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-2 top-1.5 text-xs text-gray-500">$</span>
                                                <input name="rate" type="number" placeholder="Rate" className="bg-black border border-[var(--border-subtle)] rounded pl-5 pr-2 py-1.5 text-xs w-full focus:border-violet-500 outline-none" required />
                                            </div>
                                            <button className="bg-white text-black text-xs font-bold px-4 py-1.5 rounded hover:bg-gray-200">Add</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Summary & Commissions */}
                        <div className="lg:col-span-1 space-y-8">
                            {/* Summary Box */}
                            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-xl">
                                <h3 className="font-bold text-sm mb-4">Billing Summary</h3>
                                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-[var(--text-tertiary)]">
                                        <span>TPS ({settings?.tax_tps_rate || 5}%)</span>
                                        <span>${(totalValue * ((settings?.tax_tps_rate || 5) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-[var(--text-tertiary)]">
                                        <span>TVQ ({settings?.tax_tvq_rate || 9.975}%)</span>
                                        <span>${(totalValue * ((settings?.tax_tvq_rate || 9.975) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] flex justify-between font-bold text-white text-lg">
                                        <span>Total</span>
                                        <span>${(totalValue * (1 + ((settings?.tax_tps_rate || 5) + (settings?.tax_tvq_rate || 9.975)) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Commissions */}
                            <CommissionCalculator
                                clientId={project.client_id}
                                projectId={project.id}
                                commissions={commissions}
                                projectTotal={totalValue}
                                teamMembers={teamMembers}
                            />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
