
'use client';

import { addShoot, addShootVideo, toggleShootVideo } from '@/app/actions';
import { Shoot, ShootVideo } from '@/types';
import { useState, useTransition } from 'react';
import { ArrowRight } from 'lucide-react';

// Sub-component for individual shoot card
function ShootCard({ shoot, videos, clientId }: { shoot: Shoot & { post_prod_status?: string, post_prod_id?: number }, videos: ShootVideo[], clientId: number }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate progress
    const total = videos.length;
    const completed = videos.filter(v => v.completed === 1).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return (
        <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden mb-4">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-center bg-white/5 px-3 py-1 rounded border border-white/5 min-w-[60px]">
                        <span className="text-xs text-gray-500 uppercase">{new Date(shoot.shoot_date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-xl font-bold">{new Date(shoot.shoot_date).getDate()}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <a href={`/shoots/${shoot.id}`} className="font-bold text-lg hover:text-violet-400 transition-colors flex items-center gap-2 group-hover:text-violet-300">
                                {shoot.title}
                                <span className="text-xs opacity-0 group-hover-opacity-100">↗</span>
                            </a>
                            {/* Status Badge */}
                            {shoot.post_prod_status ? (
                                <a href={`/post-production/${shoot.post_prod_id}`} onClick={(e) => e.stopPropagation()} className="hover:opacity-80 transition-opacity">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                        Post-Prod: {shoot.post_prod_status}
                                    </span>
                                </a>
                            ) : (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${shoot.status === 'Completed'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    }`}>
                                    {shoot.status === 'Completed' ? 'Completed' : 'Shooting'}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 mb-1">
                            <a
                                href={shoot.post_prod_id ? `/post-production/${shoot.post_prod_id}` : `/shoots/${shoot.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className={`text-[10px] font-bold flex items-center gap-1 ${shoot.post_prod_id ? 'text-orange-400 hover:text-orange-300' : 'text-indigo-400 hover:text-indigo-300'}`}
                            >
                                {shoot.post_prod_id ? 'View Post-Prod' : 'View Shoot'} <ArrowRight size={12} />
                            </a>
                            {shoot.project_id && (
                                <a href={`/projects/${shoot.project_id}`} onClick={(e) => e.stopPropagation()} className="text-[10px] font-bold text-[var(--text-tertiary)] hover:text-white flex items-center gap-1">
                                    View Project <ArrowRight size={12} />
                                </a>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-1.5 w-24 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-400">{completed}/{total} videos</span>
                        </div>
                    </div>
                </div>
                <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</div>
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="space-y-2 mb-4">
                        {videos.map(video => (
                            <div key={video.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded transition-colors group">
                                <input
                                    type="checkbox"
                                    checked={video.completed === 1}
                                    onChange={() => toggleShootVideo(video.id, video.completed, clientId, shoot.id)}
                                    className="w-5 h-5 rounded border-white/20 bg-black/50 checked:bg-violet-500 cursor-pointer"
                                />
                                <span className={video.completed === 1 ? 'text-gray-500 line-through' : 'text-gray-200'}>{video.title}</span>
                            </div>
                        ))}
                        {videos.length === 0 && <p className="text-sm text-gray-500 italic">No videos planned yet.</p>}
                    </div>

                    <form action={addShootVideo} className="flex gap-2">
                        <input type="hidden" name="shootId" value={shoot.id} />
                        <input type="hidden" name="clientId" value={clientId} />
                        <input name="title" placeholder="Add video to shoot plan..." className="bg-black/40 border border-white/10 px-3 py-1.5 rounded text-sm flex-1 focus:outline-none focus:border-violet-500" required />
                        <button className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm">+</button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default function ShootManager({ clientId, shoots, videosMap, projectId }: { clientId: number, shoots: (Shoot & { post_prod_status?: string, post_prod_id?: number })[], videosMap: Record<number, ShootVideo[]>, projectId?: number }) {

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold neo-gradient-text">Production Schedule</h3>
            </div>

            <div className="mb-8">
                {shoots.map(shoot => (
                    <ShootCard
                        key={shoot.id}
                        shoot={shoot}
                        videos={videosMap[shoot.id] || []}
                        clientId={clientId}
                    />
                ))}
                {shoots.length === 0 && <p className="text-gray-500 text-center py-8">No shoots scheduled for this project.</p>}
            </div>

            <form action={addShoot} className="border-t border-white/10 pt-6">
                <h4 className="text-sm font-medium mb-3 text-gray-300">Schedule New Shoot</h4>
                <input type="hidden" name="clientId" value={clientId} />
                {projectId && <input type="hidden" name="projectId" value={projectId} />}
                <div className="flex gap-2">
                    <input type="date" name="date" className="bg-black/40 border border-white/10 p-2 rounded text-sm text-white color-scheme-dark" required />
                    <input name="title" placeholder="Shoot Title (e.g. October Content Day)" className="bg-black/40 border border-white/10 p-2 rounded text-sm flex-1 focus:outline-none focus:border-violet-500" required />
                    <button className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded text-sm font-medium">Schedule</button>
                </div>
            </form>
        </div>
    );
}
