import { getActors, createActor, deleteActor } from '@/app/actor-actions';
import Link from 'next/link';
import { Users, MapPin, DollarSign, Plus, Trash2, Instagram, ExternalLink } from 'lucide-react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ActorsPage() {
    const session = await auth();
    if (!session) redirect('/login');
    const actors = await getActors();

    return (
        <main className="min-h-screen p-4 md:p-8 pt-20 md:pt-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-[var(--border-subtle)] pb-6">
                <div>
                    <h1 className="text-xl font-medium tracking-tight text-white flex items-center gap-3">
                        <Users size={22} className="text-violet-400" />
                        Actors
                    </h1>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">{actors.length} actor{actors.length !== 1 ? 's' : ''} in your database</p>
                </div>
            </header>

            {/* Quick Add Form */}
            <form action={createActor} className="mb-8 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input name="name" placeholder="Actor Name *" required className="pro-input" />
                    <input name="email" placeholder="Email" className="pro-input" />
                    <input name="phone" placeholder="Phone" className="pro-input" />
                    <input name="location" placeholder="Location" className="pro-input" />
                </div>
                <div className="flex justify-end mt-3">
                    <button type="submit" className="px-4 py-2 bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition-colors flex items-center gap-2">
                        <Plus size={16} /> Add Actor
                    </button>
                </div>
            </form>

            {/* Actors Grid */}
            {actors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
                        <Users size={32} className="text-violet-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No Actors Yet</h3>
                    <p className="text-[var(--text-tertiary)] text-sm max-w-md">Add your first actor above to start building your talent database.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {actors.map((actor: any) => (
                        <Link key={actor.id} href={`/actors/${actor.id}`} className="group">
                            <article className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-violet-500/40 hover:bg-[#111] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-lg">
                                            {actor.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white group-hover:text-violet-200 transition-colors">{actor.name}</h3>
                                            {actor.location && (
                                                <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                                                    <MapPin size={10} /> {actor.location}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <ExternalLink size={14} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                                    {actor.remuneration_per_shoot > 0 && (
                                        <div className="flex items-center gap-1">
                                            <DollarSign size={12} />
                                            {actor.remuneration_per_shoot}/shoot
                                        </div>
                                    )}
                                    {actor.instagram && (
                                        <div className="flex items-center gap-1">
                                            <Instagram size={12} /> IG
                                        </div>
                                    )}
                                    {actor.availability && (
                                        <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px]">
                                            {actor.availability}
                                        </span>
                                    )}
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
