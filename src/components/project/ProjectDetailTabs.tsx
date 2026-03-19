'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, Video, CheckSquare, DollarSign, Layers, ExternalLink, Download } from 'lucide-react';
import ProjectTitleEditor from '@/components/ProjectTitleEditor';
import StatusSelector from '@/components/ProjectStatusSelect';
import ShootManager from '@/components/ShootManager';
import ProjectTaskManager from '@/components/ProjectTaskManager';
import ProjectCostManager from '@/components/ProjectCostManager';
import ProjectSyncButton from '@/components/ProjectSyncButton';
import { InvoiceButton } from '@/components/InvoiceButton';
import type { Project, Shoot, ProjectTask, TaskStage, Client } from '@/types';

type PostProdWorkflow = { id: number; shoot_title?: string; template_name?: string; status?: string; progress?: number };

type ProjectDetailTabsProps = {
  project: Project & { client_company?: string; agency_name?: string; agency_color?: string; total_revenue?: number; total_cost?: number; total_margin?: number; margin_percentage?: number };
  client: Client;
  shoots: Shoot[];
  tasks: ProjectTask[];
  stages: TaskStage[];
  teamMembers: any[];
  services: any[];
  settings: any;
  projectCosts: any[];
  videosMap: Record<number, any[]>;
  postProdWorkflows: PostProdWorkflow[];
};

const TABS = [
  { id: 'overview', label: 'Vue d’ensemble', icon: Activity },
  { id: 'shoots', label: 'Shoots', icon: Video },
  { id: 'tasks', label: 'Tâches', icon: CheckSquare },
  { id: 'financials', label: 'Coûts & facturation', icon: DollarSign },
  { id: 'postprod', label: 'Post-production', icon: Layers },
] as const;

export default function ProjectDetailTabs({
  project,
  client,
  shoots,
  tasks,
  stages,
  teamMembers,
  services,
  settings,
  projectCosts,
  videosMap,
  postProdWorkflows,
}: ProjectDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('overview');

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const taskProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border-subtle)] flex gap-1 overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--bg-surface)] text-indigo-400 border border-[var(--border-subtle)] border-b-transparent -mb-px'
                  : 'text-[var(--text-tertiary)] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 space-y-6">
            <div className="pro-dashboard-card p-6 rounded-2xl">
              <h3 className="section-label mb-4 flex items-center gap-2">
                <Activity size={16} className="text-violet-400" /> Statut
              </h3>
              <StatusSelector projectId={project.id} currentStatus={project.status} />
              <div className="pt-4 border-t border-[var(--border-subtle)] text-sm text-[var(--text-secondary)]">
                Agency: {project.agency_name || 'Direct'}
              </div>
            </div>
            <div className="pro-dashboard-card p-6 rounded-2xl">
              <h3 className="section-label mb-4">Progression livrables</h3>
              <div className="text-4xl font-bold font-mono text-white">{taskProgress}%</div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${taskProgress}%` }} />
              </div>
              <div className="mt-2 text-xs text-[var(--text-tertiary)]">{completedTasks} fait · {totalTasks - completedTasks} restant</div>
            </div>
            <div className="pro-dashboard-card p-6 rounded-2xl">
              <h3 className="section-label mb-4 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-400" /> Finances
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Revenus</div>
                  <div className="text-xl font-bold text-white">${project.total_revenue?.toLocaleString() || '0'}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">Coût</div>
                    <div className="flex items-center gap-1">
                      <span>${project.total_cost?.toLocaleString() || '0'}</span>
                      <ProjectSyncButton projectId={project.id} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">Marge</div>
                    <div className={(project.total_margin || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      ${project.total_margin?.toLocaleString() || '0'} ({project.margin_percentage ? Math.round(project.margin_percentage) : 0}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="xl:col-span-2 space-y-6">
            <div className="pro-dashboard-card p-6 rounded-2xl">
              <h3 className="section-label mb-4 flex items-center gap-2">
                <Video size={16} className="text-indigo-400" /> Prochains shoots
              </h3>
              <div className="min-h-[200px]">
                <ShootManager clientId={project.client_id} shoots={shoots} videosMap={videosMap} projectId={project.id} />
              </div>
            </div>
            <div className="pro-dashboard-card p-6 rounded-2xl">
              <h3 className="section-label mb-4 flex items-center gap-2">
                <Layers size={16} className="text-pink-400" /> Post-production
              </h3>
              {postProdWorkflows.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)]">Aucun workflow post-prod pour ce projet.</p>
              ) : (
                <div className="space-y-3">
                  {postProdWorkflows.slice(0, 3).map((w) => (
                    <Link key={w.id} href={`/post-production/${w.id}`} className="block p-3 rounded-lg bg-[#0A0A0A] border border-[var(--border-subtle)] hover:border-violet-500/30">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm text-white">{w.shoot_title || 'Untitled'}</span>
                        <span className="text-xs text-[var(--text-tertiary)]">{w.progress}%</span>
                      </div>
                    </Link>
                  ))}
                  {postProdWorkflows.length > 3 && (
                    <Link href="/post-production" className="text-xs text-violet-400 hover:text-violet-300">Voir tout ({postProdWorkflows.length})</Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shoots' && (
        <div className="pro-dashboard-card p-6 rounded-2xl min-h-[400px]">
          <ShootManager clientId={project.client_id} shoots={shoots} videosMap={videosMap} projectId={project.id} />
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="pro-dashboard-card p-6 rounded-2xl min-h-[400px]">
          <ProjectTaskManager projectId={project.id} tasks={tasks} stages={stages} teamMembers={teamMembers} />
        </div>
      )}

      {activeTab === 'financials' && (
        <div className="space-y-6 max-w-2xl">
          <div className="pro-dashboard-card p-6 rounded-2xl">
            <h3 className="section-label mb-4">Résumé financier</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Revenus</div>
                <div className="text-2xl font-bold text-white">${project.total_revenue?.toLocaleString() || '0'}</div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase flex items-center gap-1">Coût <ProjectSyncButton projectId={project.id} /></div>
                <div className="text-xl font-medium text-[var(--text-secondary)]">${project.total_cost?.toLocaleString() || '0'}</div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Marge</div>
                <div className={`text-xl font-bold ${(project.total_margin || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${project.total_margin?.toLocaleString() || '0'} ({project.margin_percentage ? Math.round(project.margin_percentage) : 0}%)
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] flex gap-3 flex-wrap">
              <Link href={`/projects/${project.id}/invoice`} className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 py-2 px-4 rounded-xl text-sm font-medium">
                <ExternalLink size={14} /> Voir la facture
              </Link>
              <InvoiceButton project={project} client={client} services={services} settings={settings} className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-2 px-4 rounded-xl text-sm font-medium">
                <Download size={14} /> Télécharger PDF
              </InvoiceButton>
            </div>
          </div>
          <div className="pro-dashboard-card p-6 rounded-2xl">
            <h3 className="section-label mb-4">Détail des coûts</h3>
            <ProjectCostManager projectId={project.id} initialCosts={projectCosts} />
          </div>
        </div>
      )}

      {activeTab === 'postprod' && (
        <div className="pro-dashboard-card p-6 rounded-2xl">
          <h3 className="section-label mb-6 flex items-center gap-2">
            <Layers size={16} className="text-pink-400" /> Post-production
          </h3>
          {postProdWorkflows.length === 0 ? (
            <div className="text-sm text-[var(--text-tertiary)] text-center py-12 bg-[#0A0A0A] rounded-xl border border-[var(--border-subtle)]">
              Aucun workflow post-production pour les shoots de ce projet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {postProdWorkflows.map((w) => (
                <Link key={w.id} href={`/post-production/${w.id}`} className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-violet-500/50 transition-colors flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white text-sm">{w.shoot_title || 'Untitled Shoot'}</h4>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Template: {w.template_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${w.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : w.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/10 text-[var(--text-tertiary)]'}`}>
                      {w.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 transition-all" style={{ width: `${w.progress ?? 0}%` }} />
                      </div>
                      <span className="text-xs text-[var(--text-tertiary)]">{w.progress ?? 0}%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
