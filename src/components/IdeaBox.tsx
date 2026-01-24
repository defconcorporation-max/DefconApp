
'use client';

import { addIdea, updateIdeaStatus } from '@/app/actions';
import { useState } from 'react';

export default function IdeaBox({ clientId, ideas }: { clientId: number, ideas: any[] }) {
    const [expandedIds, setExpandedIds] = useState<number[]>([]);

    const activeIdeas = ideas.filter(i => i.status !== 'Archived');
    const archivedIdeas = ideas.filter(i => i.status === 'Archived');

    const toggleExpand = (id: number) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        await updateIdeaStatus(id, newStatus, clientId);
    };

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold neo-gradient-text">Idea Box</h3>
                <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">{activeIdeas.length} Active</span>
            </div>

            {/* Add Idea Form */}
            <form action={addIdea} className="mb-8">
                <input type="hidden" name="clientId" value={clientId} />
                <div className="flex flex-col gap-2">
                    <input name="title" placeholder="New Content Idea title..." className="bg-black/40 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-violet-500 transition-colors w-full" required />
                    <textarea name="description" placeholder="Expand on the idea (optional)..." rows={2} className="bg-black/40 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-violet-500 transition-colors w-full text-sm resize-none"></textarea>
                    <div className="flex justify-end">
                        <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-sm transition-colors">Add Idea</button>
                    </div>
                </div>
            </form>

            {/* Active Ideas List */}
            <div className="space-y-3 mb-8">
                {activeIdeas.map(idea => (
                    <div key={idea.id} className={`bg-black/20 border border-white/5 rounded-xl transition-all duration-300 ${expandedIds.includes(idea.id) ? 'p-4' : 'p-3'}`}>
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                className="mt-1.5 w-4 h-4 rounded border-white/20 bg-black/50 checked:bg-violet-500 cursor-pointer"
                                onChange={() => handleStatusChange(idea.id, 'Archived')}
                            />
                            <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(idea.id)}>
                                <h4 className="font-medium text-gray-200">{idea.title}</h4>
                                {expandedIds.includes(idea.id) && idea.description && (
                                    <p className="mt-2 text-sm text-gray-400 whitespace-pre-wrap animate-in fade-in slide-in-from-top-1">{idea.description}</p>
                                )}
                            </div>
                            <button onClick={() => toggleExpand(idea.id)} className="text-gray-500 hover:text-white transition-colors">
                                {expandedIds.includes(idea.id) ? '−' : '+'}
                            </button>
                        </div>
                    </div>
                ))}
                {activeIdeas.length === 0 && <p className="text-center text-gray-600 text-sm py-4">No active ideas. Brainstorm something!</p>}
            </div>

            {/* Archived Section */}
            {archivedIdeas.length > 0 && (
                <details className="mt-6">
                    <summary className="cursor-pointer text-xs text-gray-500 uppercase tracking-widest hover:text-gray-300 transition-colors">Show Archived Ideas ({archivedIdeas.length})</summary>
                    <div className="mt-4 space-y-2 opacity-50">
                        {archivedIdeas.map(idea => (
                            <div key={idea.id} className="flex gap-2 items-center p-2 border-b border-white/5">
                                <span className="text-green-500">✓</span>
                                <span className="line-through text-gray-500 text-sm">{idea.title}</span>
                                <button onClick={() => handleStatusChange(idea.id, 'ToDo')} className="ml-auto text-xs text-gray-600 hover:text-white underline">Restore</button>
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}
