import { getActor, getActorClients, updateActor, deleteActor, addActorClient, removeActorClient } from '@/app/actor-actions';
import { getClients } from '@/app/actions';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, DollarSign, Instagram, Share2, Trash2 } from 'lucide-react';
import ActorActions from '@/components/ActorActions';

export const dynamic = 'force-dynamic';

export default async function ActorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect('/login');

    const { id } = await params;
    const actorId = Number(id);

    const [actor, actorClients, allClients] = await Promise.all([
        getActor(actorId),
        getActorClients(actorId),
        getClients(),
    ]);

    if (!actor) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Actor Not Found</h1>
                <Link href="/actors" className="text-violet-400 hover:underline">← Back to Actors</Link>
            </div>
        </div>
    );

    const portfolioItems = actor.portfolio_urls ? actor.portfolio_urls.split(',').filter((u: string) => u.trim()) : [];

    return (
        <main className="min-h-screen p-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <Link href="/actors" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-xl">
                        {actor.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{actor.name}</h1>
                        {actor.location && (
                            <div className="flex items-center gap-1 text-sm text-[var(--text-tertiary)]">
                                <MapPin size={14} /> {actor.location}
                            </div>
                        )}
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Link
                        href={`/actors/${actor.id}/share`}
                        target="_blank"
                        className="px-3 py-1.5 text-xs border border-[var(--border-subtle)] rounded hover:bg-white/5 transition-colors flex items-center gap-2 text-[var(--text-secondary)]"
                    >
                        <Share2 size={14} /> Share Profile
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Edit Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form action={updateActor} className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 space-y-4">
                        <input type="hidden" name="id" value={actor.id} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Name *</label>
                                <input name="name" defaultValue={actor.name} required className="pro-input w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Email</label>
                                <input name="email" type="email" defaultValue={actor.email} className="pro-input w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Phone</label>
                                <input name="phone" defaultValue={actor.phone} className="pro-input w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Location</label>
                                <input name="location" defaultValue={actor.location} className="pro-input w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Availability</label>
                                <input name="availability" defaultValue={actor.availability} placeholder="e.g. Weekdays, Full-time" className="pro-input w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Remuneration / Shoot ($)</label>
                                <input name="remuneration_per_shoot" type="number" step="0.01" defaultValue={actor.remuneration_per_shoot} className="pro-input w-full" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Potential Conflicts</label>
                            <textarea name="potential_conflicts" defaultValue={actor.potential_conflicts} rows={2} className="pro-input w-full resize-none" placeholder="e.g. Exclusive contract with Brand X" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Additional Info</label>
                            <textarea name="additional_info" defaultValue={actor.additional_info} rows={3} className="pro-input w-full resize-none" />
                        </div>

                        <div className="border-t border-[var(--border-subtle)] pt-4">
                            <h3 className="text-xs text-[var(--text-secondary)] uppercase font-mono mb-3">Social Media</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-[var(--text-tertiary)]">Instagram</label>
                                    <input name="instagram" defaultValue={actor.instagram} placeholder="@handle or URL" className="pro-input w-full" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-[var(--text-tertiary)]">Facebook</label>
                                    <input name="facebook" defaultValue={actor.facebook} placeholder="URL" className="pro-input w-full" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-[var(--text-tertiary)]">TikTok</label>
                                    <input name="tiktok" defaultValue={actor.tiktok} placeholder="@handle or URL" className="pro-input w-full" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Portfolio URLs (comma-separated)</label>
                            <textarea name="portfolio_urls" defaultValue={actor.portfolio_urls} rows={2} className="pro-input w-full resize-none" placeholder="https://youtube.com/..., https://drive.google.com/..." />
                        </div>

                        <div className="flex justify-between pt-2">
                            <ActorActions actorId={actor.id} />
                            <button type="submit" className="px-4 py-2 bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Sidebar: Portfolio + Clients */}
                <div className="space-y-6">
                    {/* Portfolio Preview */}
                    <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-5">
                        <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Portfolio</h3>
                        {portfolioItems.length === 0 ? (
                            <p className="text-xs text-[var(--text-tertiary)] italic">No portfolio items added yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {portfolioItems.map((url: string, i: number) => (
                                    <a key={i} href={url.trim()} target="_blank" rel="noopener"
                                        className="block text-xs text-indigo-400 hover:text-indigo-300 truncate hover:underline transition-colors">
                                        {url.trim()}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Clients Worked With */}
                    <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-5">
                        <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Clients Worked With</h3>
                        {actorClients.length === 0 ? (
                            <p className="text-xs text-[var(--text-tertiary)] italic">No clients linked yet.</p>
                        ) : (
                            <div className="space-y-2 mb-3">
                                {actorClients.map((c: any) => (
                                    <div key={c.id} className="flex items-center justify-between text-sm bg-white/5 px-3 py-2 rounded">
                                        <Link href={`/clients/${c.id}`} className="text-white hover:text-violet-400 transition-colors">
                                            {c.company_name || c.name}
                                        </Link>
                                        <form action={async () => {
                                            'use server';
                                            await removeActorClient(actorId, c.id);
                                        }}>
                                            <button className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                                        </form>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Add Client */}
                        <form action={async (formData: FormData) => {
                            'use server';
                            const clientId = Number(formData.get('clientId'));
                            if (clientId) await addActorClient(actorId, clientId);
                        }} className="flex gap-2">
                            <select name="clientId" className="flex-1 pro-input text-xs">
                                <option value="">Link a client...</option>
                                {allClients.filter((c: any) => !actorClients.find((ac: any) => ac.id === c.id)).map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.company_name || c.name}</option>
                                ))}
                            </select>
                            <button type="submit" className="px-3 py-1 bg-violet-500/20 text-violet-400 text-xs rounded hover:bg-violet-500/30 transition-colors">
                                Link
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
