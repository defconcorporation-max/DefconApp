import { getActor, getActorPortfolio } from '@/app/actor-actions';
import { MapPin, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Public shareable actor profile page.
 * Shows only name, profile picture, location, and portfolio — no private info.
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
            <header className="bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-3 flex items-center gap-3">
                <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center font-bold text-sm">D</div>
                <span className="font-bold tracking-wider text-sm">DEFCON VISUAL</span>
            </header>

            {/* Profile Header */}
            <div className="max-w-lg mx-auto px-6 pt-10 pb-6 text-center border-b border-white/5">
                {/* Profile Picture */}
                <div className="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden border-2 border-white/10 shadow-2xl">
                    {actor.profile_picture ? (
                        <img src={actor.profile_picture} alt={actor.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-violet-400 font-bold text-4xl">
                            {actor.name.charAt(0)}
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-bold">{actor.name}</h1>
                {actor.location && (
                    <div className="flex items-center justify-center gap-1 text-gray-400 mt-1.5 text-sm">
                        <MapPin size={14} /> {actor.location}
                    </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-center gap-8 mt-6 text-sm">
                    <div className="text-center">
                        <div className="font-bold text-white text-lg">{portfolio.length}</div>
                        <div className="text-gray-500 text-xs uppercase tracking-wider">Posts</div>
                    </div>
                </div>
            </div>

            {/* Portfolio Grid — Instagram style */}
            <div className="max-w-lg mx-auto">
                {portfolio.length > 0 ? (
                    <div className="grid grid-cols-3 gap-0.5">
                        {portfolio.map((item: any) => (
                            <div key={item.id} className="aspect-square overflow-hidden bg-[#111] relative group">
                                {item.file_type === 'image' ? (
                                    <img
                                        src={item.url}
                                        alt={item.file_name || 'Portfolio'}
                                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                    />
                                ) : (
                                    <video
                                        src={item.url}
                                        className="w-full h-full object-cover"
                                        controls
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500">
                        <Users size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm">No portfolio items yet.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
