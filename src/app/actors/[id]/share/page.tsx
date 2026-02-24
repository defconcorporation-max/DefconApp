import { getActor } from '@/app/actor-actions';
import { Users, MapPin, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Public shareable actor profile page.
 * Shows only the name and portfolio — no private info.
 */
export default async function ShareActorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const actor = await getActor(Number(id));

    if (!actor) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <h1 className="text-2xl font-bold">Profile Not Found</h1>
        </div>
    );

    const portfolioItems = actor.portfolio_urls ? actor.portfolio_urls.split(',').filter((u: string) => u.trim()) : [];

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

                {/* Portfolio */}
                {portfolioItems.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold mb-6 text-center">Portfolio</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {portfolioItems.map((url: string, i: number) => {
                                const trimUrl = url.trim();
                                const isYoutube = trimUrl.includes('youtube.com') || trimUrl.includes('youtu.be');
                                const isVimeo = trimUrl.includes('vimeo.com');

                                if (isYoutube || isVimeo) {
                                    // Embed video
                                    let embedUrl = trimUrl;
                                    if (isYoutube) {
                                        const videoId = trimUrl.match(/(?:v=|youtu\.be\/)([^&]+)/)?.[1];
                                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                    }
                                    return (
                                        <div key={i} className="aspect-video rounded-xl overflow-hidden border border-white/10">
                                            <iframe src={embedUrl} className="w-full h-full" allowFullScreen />
                                        </div>
                                    );
                                }

                                // Regular link
                                return (
                                    <a key={i} href={trimUrl} target="_blank" rel="noopener"
                                        className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group">
                                        <ExternalLink size={18} className="text-violet-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm text-gray-300 group-hover:text-white truncate">{trimUrl}</span>
                                    </a>
                                );
                            })}
                        </div>
                    </section>
                )}

                {portfolioItems.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Users size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No portfolio items available yet.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
