'use client';

import { useState, useEffect } from 'react';
import { Shoot } from '@/types';
import { updateShootCreative } from '@/app/actions';
import { Lightbulb, LayoutGrid, List, Save, Loader2 } from 'lucide-react';
import ShotListBuilder from './ShotListBuilder';
import MoodboardGrid from './MoodboardGrid';

interface CreativeDirectorProps {
    shoot: Shoot;
}

export default function CreativeDirector({ shoot }: CreativeDirectorProps) {
    const [activeTab, setActiveTab] = useState<'concept' | 'moodboard' | 'shotlist'>('concept');
    const [saving, setSaving] = useState(false);

    // Local State
    const [concept, setConcept] = useState(shoot.concept || '');
    const [mood, setMood] = useState(shoot.mood || '');
    const [shotList, setShotList] = useState<any[]>(shoot.shot_list ? JSON.parse(shoot.shot_list) : []);
    const [moodboard, setMoodboard] = useState<string[]>(shoot.moodboard_urls ? JSON.parse(shoot.moodboard_urls) : []);

    const handleSave = async () => {
        setSaving(true);
        await updateShootCreative(shoot.id, {
            concept,
            mood,
            shot_list: JSON.stringify(shotList),
            moodboard_urls: JSON.stringify(moodboard)
        });
        setSaving(false);
    };

    // Auto-save Shot List and Moodboard on change? 
    // Maybe better to have explicit save for Concept, but ShotList updates usually want to be snappy.
    // For now, single explicit Save button for simplicity to avoid race conditions.

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden mb-8">
            <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-root)] px-4 py-2 flex items-center justify-between">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('concept')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'concept' ? 'border-violet-500 text-violet-400' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
                    >
                        <Lightbulb size={16} />
                        Concept & Mood
                    </button>
                    <button
                        onClick={() => setActiveTab('moodboard')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'moodboard' ? 'border-pink-500 text-pink-400' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
                    >
                        <LayoutGrid size={16} />
                        Moodboard
                    </button>
                    <button
                        onClick={() => setActiveTab('shotlist')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'shotlist' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
                    >
                        <List size={16} />
                        Shot List
                    </button>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    SAVE PLAN
                </button>
            </div>

            <div className="p-6 min-h-[400px]">
                {activeTab === 'concept' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Concept / Directives</h3>
                                <textarea
                                    value={concept}
                                    onChange={(e) => setConcept(e.target.value)}
                                    placeholder="Describe the main concept, goals, and key deliverables..."
                                    className="w-full h-64 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-4 text-sm text-white focus:border-violet-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Mood & Tone</h3>
                                <textarea
                                    value={mood}
                                    onChange={(e) => setMood(e.target.value)}
                                    placeholder="Keywords: Cinematic, Dark, High-Energy..."
                                    className="w-full h-64 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-4 text-sm text-white focus:border-pink-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'moodboard' && (
                    <div className="animate-in fade-in duration-300">
                        <MoodboardGrid images={moodboard} setImages={setMoodboard} />
                    </div>
                )}

                {activeTab === 'shotlist' && (
                    <div className="animate-in fade-in duration-300">
                        <ShotListBuilder shots={shotList} setShots={setShotList} />
                    </div>
                )}
            </div>
        </div>
    );
}
