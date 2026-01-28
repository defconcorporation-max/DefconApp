import { getPostProdDashboard } from '@/app/post-prod-actions';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Film, ArrowUpRight } from 'lucide-react';

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
                    <Link key={p.id} href={`/post-production/${p.id}`} className="group">
                        <Card className="hover:border-indigo-500/50 transition-colors h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-black rounded-lg border border-[var(--border-subtle)]">
                                    <Film size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <ArrowUpRight size={20} className="text-[var(--text-tertiary)] group-hover:text-white" />
                            </div>

                            <h3 className="font-bold text-lg mb-1 group-hover:text-indigo-400 transition-colors">{p.shoot_title}</h3>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs text-[var(--text-secondary)]">{p.template_name}</span>
                                <Badge variant="default" className="text-[10px] h-5">{p.status}</Badge>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                    <span>Progress</span>
                                    <span>{p.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-indigo-500 h-full"
                                        style={{ width: `${p.progress}%` }}
                                    />
                                </div>
                            </div>
                        </Card>
                    </Link>
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
