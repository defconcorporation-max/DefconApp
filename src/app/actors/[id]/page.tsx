import { getActor, getActorClients, getActorPortfolio, updateActor, addActorClient, removeActorClient } from '@/app/actor-actions';
import { getClients } from '@/app/actions';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, DollarSign, Mail, Phone, Share2, Trash2, Instagram, Globe, Settings, Users, Image as ImageIcon } from 'lucide-react';
import ActorActions from '@/components/ActorActions';
import PortfolioUploader, { ProfilePictureUploader } from '@/components/PortfolioUploader';

export const dynamic = 'force-dynamic';

export default async function ActorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect('/login');

    const { id } = await params;
    const actorId = Number(id);

    const [actor, actorClients, allClients, portfolio] = await Promise.all([
        getActor(actorId),
        getActorClients(actorId),
        getClients(),
        getActorPortfolio(actorId),
    ]);

    if (!actor) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Actor Not Found</h1>
                <Link href="/actors" className="text-violet-400 hover:underline">← Back to Actors</Link>
            </div>
        </div>
    );

    return (
        <main className="min-h-screen pb-20">
            {/* Top Bar */}
            <div className="sticky top-0 z-20 bg-[var(--bg-root)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/actors" className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <span className="font-bold text-white">{actor.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/actors/${actor.id}/share`}
                        target="_blank"
                        className="px-3 py-1.5 text-xs border border-[var(--border-subtle)] rounded-full hover:bg-white/5 transition-colors flex items-center gap-2 text-[var(--text-secondary)]"
                    >
                        <Share2 size={14} /> Share
                    </Link>
                </div>
            </div>

            {/* Profile Header — Social Media Style */}
            <div className="px-6 py-8 border-b border-[var(--border-subtle)]">
                <div className="max-w-3xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Profile Picture */}
                        <ProfilePictureUploader actorId={actorId} currentPicture={actor.profile_picture} actorName={actor.name} />

                        {/* Profile Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-3">
                                <h1 className="text-2xl font-bold text-white">{actor.name}</h1>
                                {actor.availability && (
                                    <span className="inline-flex px-2.5 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20 w-fit mx-auto md:mx-0">
                                        {actor.availability}
                                    </span>
                                )}
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center justify-center md:justify-start gap-6 text-sm mb-4">
                                <div className="text-center">
                                    <span className="font-bold text-white">{portfolio.length}</span>
                                    <span className="text-[var(--text-tertiary)] ml-1">posts</span>
                                </div>
                                <div className="text-center">
                                    <span className="font-bold text-white">{actorClients.length}</span>
                                    <span className="text-[var(--text-tertiary)] ml-1">clients</span>
                                </div>
                                {actor.remuneration_per_shoot > 0 && (
                                    <div className="text-center">
                                        <span className="font-bold text-white">${actor.remuneration_per_shoot}</span>
                                        <span className="text-[var(--text-tertiary)] ml-1">/shoot</span>
                                    </div>
                                )}
                            </div>

                            {/* Bio / Info */}
                            <div className="space-y-1 text-sm">
                                {actor.location && (
                                    <div className="flex items-center justify-center md:justify-start gap-1.5 text-[var(--text-secondary)]">
                                        <MapPin size={14} className="text-[var(--text-tertiary)]" /> {actor.location}
                                    </div>
                                )}
                                {actor.additional_info && (
                                    <p className="text-[var(--text-secondary)] max-w-md">{actor.additional_info}</p>
                                )}

                                {/* Social Links */}
                                <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                                    {actor.instagram && (
                                        <a href={actor.instagram.startsWith('http') ? actor.instagram : `https://instagram.com/${actor.instagram.replace('@', '')}`}
                                            target="_blank" rel="noopener" className="text-[var(--text-tertiary)] hover:text-pink-400 transition-colors">
                                            <Instagram size={18} />
                                        </a>
                                    )}
                                    {actor.facebook && (
                                        <a href={actor.facebook.startsWith('http') ? actor.facebook : `https://facebook.com/${actor.facebook}`}
                                            target="_blank" rel="noopener" className="text-[var(--text-tertiary)] hover:text-blue-400 transition-colors">
                                            <Globe size={18} />
                                        </a>
                                    )}
                                    {actor.tiktok && (
                                        <a href={actor.tiktok.startsWith('http') ? actor.tiktok : `https://tiktok.com/@${actor.tiktok.replace('@', '')}`}
                                            target="_blank" rel="noopener" className="text-[var(--text-tertiary)] hover:text-cyan-400 transition-colors text-sm font-bold">
                                            TT
                                        </a>
                                    )}
                                    {actor.email && (
                                        <a href={`mailto:${actor.email}`} className="text-[var(--text-tertiary)] hover:text-violet-400 transition-colors">
                                            <Mail size={18} />
                                        </a>
                                    )}
                                    {actor.phone && (
                                        <a href={`tel:${actor.phone}`} className="text-[var(--text-tertiary)] hover:text-violet-400 transition-colors">
                                            <Phone size={18} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs — Portfolio / Edit / Clients */}
            <div className="max-w-3xl mx-auto px-6">
                {/* Tab-like section headers */}
                <div className="flex items-center justify-center gap-12 py-3 border-b border-[var(--border-subtle)] text-xs uppercase tracking-widest font-bold mb-6">
                    <a href="#portfolio" className="text-white border-t-2 border-white pt-3 -mt-3 flex items-center gap-1.5">
                        <ImageIcon size={14} /> Portfolio
                    </a>
                    <a href="#edit" className="text-[var(--text-tertiary)] hover:text-white pt-3 -mt-3 flex items-center gap-1.5 transition-colors">
                        <Settings size={14} /> Edit Info
                    </a>
                    <a href="#clients" className="text-[var(--text-tertiary)] hover:text-white pt-3 -mt-3 flex items-center gap-1.5 transition-colors">
                        <Users size={14} /> Clients
                    </a>
                </div>

                {/* Portfolio Section */}
                <section id="portfolio" className="mb-12">
                    <PortfolioUploader actorId={actorId} portfolio={portfolio} />
                </section>

                {/* Edit Section */}
                <section id="edit" className="mb-12">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Settings size={16} className="text-violet-400" /> Edit Information
                    </h2>
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
                            <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Bio / Additional Info</label>
                            <textarea name="additional_info" defaultValue={actor.additional_info} rows={3} className="pro-input w-full resize-none" placeholder="A short bio or description..." />
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
                        <div className="flex justify-between pt-2">
                            <ActorActions actorId={actor.id} />
                            <button type="submit" className="px-5 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-200 transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </section>

                {/* Clients Section */}
                <section id="clients" className="mb-12">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Users size={16} className="text-violet-400" /> Clients Worked With
                    </h2>
                    <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-5">
                        {actorClients.length === 0 ? (
                            <p className="text-xs text-[var(--text-tertiary)] italic text-center py-4">No clients linked yet.</p>
                        ) : (
                            <div className="space-y-2 mb-4">
                                {actorClients.map((c: any) => (
                                    <div key={c.id} className="flex items-center justify-between text-sm bg-white/5 px-4 py-2.5 rounded-lg">
                                        <Link href={`/clients/${c.id}`} className="text-white hover:text-violet-400 transition-colors font-medium">
                                            {c.company_name || c.name}
                                        </Link>
                                        <form action={async () => {
                                            'use server';
                                            await removeActorClient(actorId, c.id);
                                        }}>
                                            <button className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                        </form>
                                    </div>
                                ))}
                            </div>
                        )}
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
                            <button type="submit" className="px-4 py-1.5 bg-violet-500/20 text-violet-400 text-xs rounded-full hover:bg-violet-500/30 transition-colors font-medium">
                                Link
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </main>
    );
}
