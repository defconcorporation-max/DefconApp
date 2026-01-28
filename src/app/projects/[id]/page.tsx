
import { getProjectById, getProjectShoots, getProjectServices, getServices, addProjectService, deleteProjectService, updateProjectStatus, addShoot, getShootVideos, getCommissions, getSettings, getTeamMembers, getClient, getProjectTasks, getTaskStages } from '@/app/actions';
import { Project, Shoot, Service, ProjectService, Commission, Client, ProjectTask, TaskStage } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Calendar, DollarSign, Trash2, Video, Plus } from 'lucide-react';
import ShootManager from '@/components/ShootManager';
import StatusSelector from '@/components/StatusSelector';
import ProjectTitleEditor from '@/components/ProjectTitleEditor';
import CommissionCalculator from '@/components/CommissionCalculator';

import { InvoiceButton } from '@/components/InvoiceButton';
import ProjectTaskManager from '@/components/ProjectTaskManager';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const projectId = Number(id);
    const project = await getProjectById(projectId) as Project & { client_company: string };

    if (!project) {
        return (
            <main className="min-h-screen p-8 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
                    <Link href="/" className="text-violet-400 hover:text-violet-300">Return to Dashboard</Link>
                </div>
            </main>
        );
    }

    const shoots = await getProjectShoots(projectId) as Shoot[];
    const projectServices = await getProjectServices(projectId) as ProjectService[];
    const catalogServices = await getServices() as Service[];
    const commissions = await getCommissions(projectId, 'project');
    const settingsRaw = await getSettings();
    const settings = settingsRaw || { id: 0, tax_tps_rate: 5, tax_tvq_rate: 9.975 };
    const teamMembers = await getTeamMembers();

    const client = await getClient(project.client_id) as Client;
    const tasks = await getProjectTasks(projectId) as ProjectTask[];
    const stages = await getTaskStages() as TaskStage[];

    // Fetch videos for ShootManager
    const videosMap: Record<number, any[]> = {};
    for (const shoot of shoots) {
        videosMap[shoot.id] = await getShootVideos(shoot.id);
    }

    // Calculate Total Value
    const servicesTotal = projectServices.reduce((acc, curr) => acc + (curr.rate * curr.quantity), 0);
    // Assuming shoots might have a value property in future, but for now just services
    const totalValue = servicesTotal;

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white pb-20">
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link href={`/clients/${project.client_id}`} className="text-[var(--text-tertiary)] hover:text-white transition-colors flex items-center gap-2 text-sm font-mono">
                        <ArrowLeft size={16} /> Back to Client
                    </Link>
                </div>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-xs text-violet-400 font-bold uppercase tracking-wider mb-1">{project.client_company}</div>
                        <ProjectTitleEditor projectId={project.id} initialTitle={project.title} />
                        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(project.created_at).toLocaleDateString()}</span>
                            <StatusSelector projectId={project.id} currentStatus={project.status} />
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-3 mb-2">
                            <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Billing Summary</div>
                            <InvoiceButton
                                project={project}
                                client={client}
                                services={projectServices}
                                settings={settings}
                                className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-white transition-colors flex items-center gap-1"
                            >
                                <span className="flex items-center gap-1">
                                    <DollarSign size={10} /> Send to Invoice
                                </span>
                            </InvoiceButton>
                        </div>
                        <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                            <div className="flex justify-between gap-8">
                                <span>Subtotal</span>
                                <span>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between gap-8 text-[var(--text-tertiary)]">
                                <span>TPS ({settings?.tax_tps_rate || 5}%)</span>
                                <span>${(totalValue * ((settings?.tax_tps_rate || 5) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between gap-8 text-[var(--text-tertiary)]">
                                <span>TVQ ({settings?.tax_tvq_rate || 9.975}%)</span>
                                <span>${(totalValue * ((settings?.tax_tvq_rate || 9.975) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-[var(--border-subtle)] flex justify-between gap-8 font-bold text-white text-lg">
                                <span>Total</span>
                                <div className="flex items-center gap-0.5">
                                    <span className="text-emerald-400">$</span>
                                    {(totalValue * (1 + ((settings?.tax_tps_rate || 5) + (settings?.tax_tvq_rate || 9.975)) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COL: Services & Billing */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-white/5">
                            <h3 className="font-bold flex items-center gap-2 text-sm"><DollarSign size={16} className="text-emerald-400" /> Billable Services</h3>
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

                        {/* Invoice Button Area */}

                        <div className="p-4 bg-white/5 flex justify-end">
                            <InvoiceButton
                                project={project}
                                client={client}
                                services={projectServices}
                                settings={settings}
                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white hover:text-emerald-400 transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <DollarSign size={14} /> Send to Invoice
                                </span>
                            </InvoiceButton>
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

                    {/* Status Control */}
                    <div className="border border-[var(--border-subtle)] rounded-xl p-4 flex justify-between items-center bg-[#0A0A0A]">
                        <span className="text-sm font-medium">Project Status</span>
                        <StatusSelector projectId={project.id} currentStatus={project.status} />
                    </div>

                    {/* Commissions for this Project */}
                    <div className="mt-8">
                        <CommissionCalculator
                            clientId={project.client_id}
                            projectId={project.id}
                            commissions={commissions}
                            projectTotal={totalValue}
                            teamMembers={teamMembers}
                        />
                    </div>
                </div>

                {/* RIGHT COL: Shoots & Tasks */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Project Deliverables (Tasks) */}
                    <ProjectTaskManager projectId={project.id} tasks={tasks} stages={stages} teamMembers={teamMembers} />

                    {/* Shoot Manager */}
                    {/* Reuse ShootManager but we need to inject our add shoot logic form or adapt it. 
                       ShootManager has "Schedule New Shoot" form at bottom. 
                       Currently ShootManager sends 'clientId' to addShoot. 
                       We need addShoot to also accept 'projectId'.
                       
                       Simplest way: Modify ShootManager to accept optional projectId.
                       But wait, ShootManager maps shoots. 
                   */}

                    {/* Let's render the list of shoots manually here OR adapt ShootManager. 
                       Adapting ShootManager is better for consistency. 
                       I will pass additional hidden input to the form inside ShootManager via simple prop logic?
                       ShootManager takes `clientId`. `addShoot` action needs to be updated to look for project_id.
                   */}

                    <ShootManager clientId={project.client_id} shoots={shoots} videosMap={videosMap} projectId={project.id} />

                    {/* Note: The ShootManager's "Schedule" form currently only sends clientId. 
                       We need to ensure it associates with THIS project.
                       Since ShootManager is used on ClientPage too (where no project is pre-selected?? wait, on client page we removed ShootManager).
                       Ah! On Client Page we now use ProjectManager.
                       So ShootManager is ONLY used here now? 
                       Verify implementation plan: "Replace ShootManager with ProjectManager on Client Page".
                       Yes. So ShootManager is now primarily for PROJECT view.
                       I should update ShootManager to accept `projectId` and pass it to `addShoot`.
                   */}
                </div>

            </div>
        </main>
    );
}
