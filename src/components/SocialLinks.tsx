
'use client';

import { addSocial, deleteSocial } from '@/app/actions';
import { useTransition } from 'react';

export default function SocialLinks({ clientId, socials }: { clientId: number, socials: any[] }) {
    // We could use optimistic updates here for "premium" feel, but standard server actions work for now.

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 neo-gradient-text">Social Connections</h3>
            <div className="space-y-3 mb-6">
                {socials.map((social) => (
                    <div key={social.id} className="flex justify-between items-center group p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <a href={social.url} target="_blank" className="flex items-center gap-3 hover:text-white transition-colors">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/40 border border-white/5 text-[10px] uppercase font-bold text-gray-400">
                                {social.platform.substring(0, 2)}
                            </span>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{social.platform}</span>
                                <span className="text-sm truncate max-w-[140px] text-gray-300 group-hover:text-violet-300 transition-colors">{social.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                            </div>
                        </a>
                        <form action={deleteSocial}>
                            <input type="hidden" name="id" value={social.id} />
                            <input type="hidden" name="clientId" value={clientId} />
                            <button className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity">✕</button>
                        </form>
                    </div>
                ))}
            </div>

            <form action={addSocial} className="flex gap-2">
                <input type="hidden" name="clientId" value={clientId} />
                <select name="platform" className="bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-gray-400 focus:outline-none">
                    <option value="Instagram">IG</option>
                    <option value="YouTube">YT</option>
                    <option value="TikTok">TT</option>
                    <option value="Website">Web</option>
                </select>
                <input name="url" placeholder="https://..." className="bg-black/30 border border-white/10 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:border-violet-500/50" required />
                <button type="submit" className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-sm transition-colors">+</button>
            </form>
        </div>
    );
}
