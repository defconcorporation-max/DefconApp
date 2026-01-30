import { getPostProdDashboard } from '@/app/post-prod-actions';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Film } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PostProdDashboardPage() {
    const projects = await getPostProdDashboard();

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Post-Production</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Manage edits, versions, and delivery workflows.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p) => (
                    <Card key={p.id} className="h-full flex flex-col p-5 border-[var(--border-subtle)] bg-[#0A0A0A] hover:border-indigo-500/50 transition-colors group relative">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-black rounded-lg border border-[var(--border-subtle)]">
                                <Film size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <Badge variant="default" className="text-[10px] h-5">{p.status}</Badge>
                        </div>

                        {/* Title Link */}
                        <Link href={`/post-production/${p.id}`} className="block mb-1">
                            <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{p.shoot_title}</h3>
                        </Link>

                        <div className="mb-6">
                            <span className="text-xs text-[var(--text-secondary)]">{p.template_name}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                <span>Progress</span>
                                <span className="text-white font-medium">{p.progress}%</span>
                            </div>
                            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-indigo-500 h-full transition-all duration-500"
                                    style={{ width: `${p.progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Footer with Button */}
                        <div className="mt-auto pt-4 border-t border-[var(--border-subtle)]">
                            <Link
                                href={`/post-production/${p.id}`}
                                className="w-full block text-center py-2.5 rounded-lg bg-white/5 hover:bg-indigo-600 hover:text-white transition-all text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                            >
                                View Project
                            </Link>
                        </div>
                    </Card>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full py-20 text-center text-[var(--text-tertiary)] bg-[#0A0A0A] border border-dashed border-[var(--border-subtle)] rounded-xl">
                        <Film className="mx-auto mb-4 opacity-20" size={48} />
                        <h3 className="text-lg font-bold mb-2">No Active Edits</h3>
                        <p>Start a workflow from a "Shoot" page to see it here.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
