import { getActor, getActorPortfolio } from '@/app/actor-actions';
import { MapPin, Users, Image, Film } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Public shareable actor profile page.
 * Shows only the name, location, and uploaded portfolio — no private info.
 */
export default async function ShareActorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [actor, portfolio] = await Promise.all([
        getActor(Number(id)),
        getActorPortfolio(Number(id)),
    ]);

    if (!actor) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <h1 className="text-2xl font-bold">Profile Not Found</h1>
        </div>
    );

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            {/* Minimal Header */}
            <header className="bg-black/80 backdrop-blur-md border-b border-white/10 px-8 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center font-bold">D</div>
                <span className="font-bold tracking-wider text-sm">DEFCON VISUAL</span>
                <span className="text-xs text-gray-500 ml-2">Actor Profile</span>
            </header>

            <div className="max-w-3xl mx-auto p-8">
                {/* Actor Card */}
                <div className="text-center mb-12">
                    <div className="w-24 h-24 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-4xl mx-auto mb-4">
                        {actor.name.charAt(0)}
                    </div>
                    <h1 className="text-3xl font-bold">{actor.name}</h1>
                    {actor.location && (
                        <div className="flex items-center justify-center gap-1 text-gray-400 mt-2">
                            <MapPin size={16} /> {actor.location}
                        </div>
                    )}
                </div>

                {/* Portfolio — Uploaded Media */}
                {portfolio.length > 0 ? (
                    <section>
                        <h2 className="text-xl font-bold mb-6 text-center">Portfolio</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {portfolio.map((item: any) => (
                                <div key={item.id} className="rounded-xl overflow-hidden border border-white/10 bg-black">
                                    {item.file_type === 'image' ? (
                                        <img
                                            src={item.url}
                                            alt={item.file_name || 'Portfolio'}
                                            className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <video
                                            src={item.url}
                                            controls
                                            className="w-full h-64 object-cover"
                                            poster=""
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Users size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No portfolio items available yet.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
