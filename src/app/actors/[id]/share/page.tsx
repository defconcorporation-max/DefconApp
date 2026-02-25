import { getActor, getActorPortfolio } from '@/app/actor-actions';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Instagram, Globe, Mail, MapPin, Play, Image as ImageIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ActorSharePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const actorId = Number(id);

    const [actor, portfolio] = await Promise.all([
        getActor(actorId),
        getActorPortfolio(actorId)
    ]);

    if (!actor) return notFound();

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            {/* Minimal Header */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[var(--border-subtle)] h-16 flex items-center px-6">
                <div className="font-bold tracking-widest uppercase text-sm bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
                    Defcon Agency
                </div>
            </header>

            <div className="pt-24 pb-20 px-6 max-w-5xl mx-auto">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row gap-8 mb-16 items-center md:items-start text-center md:text-left">
                    <div className="w-48 h-48 rounded-2xl overflow-hidden bg-[#111] flex-shrink-0 border border-[var(--border-subtle)] relative shadow-2xl">
                        {actor.profile_picture ? (
                            <Image src={actor.profile_picture} alt={actor.name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-[var(--text-tertiary)] bg-gradient-to-br from-[#111] to-[#0A0A0A]">
                                {actor.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 mt-4 md:mt-0">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">{actor.name}</h1>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-[var(--text-secondary)] mb-6">
                            {actor.location && (
                                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                    <MapPin size={14} className="text-violet-400" /> {actor.location}
                                </div>
                            )}
                            {actor.availability && (
                                <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full border border-green-500/20">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> {actor.availability}
                                </div>
                            )}
                        </div>

                        {actor.additional_info && (
                            <p className="text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-6">
                                {actor.additional_info}
                            </p>
                        )}

                        <div className="flex items-center justify-center md:justify-start gap-4">
                            {actor.instagram && (
                                <a href={actor.instagram.startsWith('http') ? actor.instagram : `https://instagram.com/${actor.instagram.replace('@', '')}`}
                                    target="_blank" rel="noopener" className="p-3 bg-white/5 hover:bg-white/10 hover:text-pink-400 rounded-xl transition-all border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                                    <Instagram size={20} />
                                </a>
                            )}
                            {actor.facebook && (
                                <a href={actor.facebook.startsWith('http') ? actor.facebook : `https://facebook.com/${actor.facebook}`}
                                    target="_blank" rel="noopener" className="p-3 bg-white/5 hover:bg-white/10 hover:text-blue-400 rounded-xl transition-all border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                                    <Globe size={20} />
                                </a>
                            )}
                            {actor.tiktok && (
                                <a href={actor.tiktok.startsWith('http') ? actor.tiktok : `https://tiktok.com/@${actor.tiktok.replace('@', '')}`}
                                    target="_blank" rel="noopener" className="p-3 bg-white/5 hover:bg-white/10 hover:text-cyan-400 rounded-xl transition-all border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center">
                                    <span className="font-bold text-sm tracking-tighter">TT</span>
                                </a>
                            )}
                            {actor.email && (
                                <a href={`mailto:${actor.email}`} className="p-3 bg-white/5 hover:bg-white/10 hover:text-violet-400 rounded-xl transition-all border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                                    <Mail size={20} />
                                </a>
                            )}
                            <a href={`mailto:bookings@defcon.agency?subject=Booking Inquiry: ${actor.name}`} className="ml-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
                                Booking Inquiry
                            </a>
                        </div>
                    </div>
                </div>

                {/* Portfolio Grid */}
                <h2 className="text-xl font-bold mb-8 flex items-center justify-center md:justify-start gap-3">
                    <ImageIcon className="text-violet-500" /> Portfolio Showcase
                </h2>

                {portfolio.length === 0 ? (
                    <div className="border border-dashed border-[var(--border-subtle)] rounded-2xl p-16 text-center text-[var(--text-tertiary)] bg-[#0A0A0A]">
                        <ImageIcon className="mx-auto mb-4 opacity-20" size={48} />
                        <p>No portfolio media uploaded yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {portfolio.map((item: any) => (
                            <div key={item.id} className="aspect-[4/5] bg-[#0A0A0A] rounded-2xl overflow-hidden relative group border border-[var(--border-subtle)] hover:border-violet-500/50 transition-colors shadow-xl">
                                {item.file_type.startsWith('video') ? (
                                    <>
                                        <video src={item.url} className="w-full h-full object-cover" loop muted playsInline onMouseOver={(e) => (e.target as HTMLVideoElement).play()} onMouseOut={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }} />
                                        <div className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white pointer-events-none">
                                            <Play size={14} className="ml-0.5" />
                                        </div>
                                    </>
                                ) : (
                                    <Image src={item.url} alt="Portfolio item" fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                )}
                                {/* Optional hover overlay for filename */}
                                {item.file_name && (
                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <p className="text-white text-xs font-medium truncate">{item.file_name}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Minimal Footer */}
            <footer className="py-8 text-center text-[var(--text-tertiary)] text-xs border-t border-[var(--border-subtle)]">
                © {new Date().getFullYear()} Defcon Agency. Shared confidential profile.
            </footer>
        </main>
    );
}
