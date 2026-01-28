'use client';

import { SocialPost, SocialAccount } from '@/types';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { createSocialPost, updateSocialPost } from '@/app/social-actions';
import { Plus, Calendar as CalendarIcon, Image as ImageIcon } from 'lucide-react';

interface PlannerProps {
    initialPosts: SocialPost[];
    accounts: SocialAccount[];
}

export default function SocialPlanner({ initialPosts, accounts }: PlannerProps) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [draggingPostId, setDraggingPostId] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, postId: number) => {
        setDraggingPostId(postId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, date: string) => {
        e.preventDefault();
        if (draggingPostId) {
            const originalPost = initialPosts.find(p => p.id === draggingPostId);
            if (!originalPost) return;

            // Keep original time, change date
            const originalTime = originalPost.scheduled_date.split('T')[1] || '10:00:00';
            const newDateTime = `${date}T${originalTime}`;

            await updateSocialPost(draggingPostId, newDateTime);
            setDraggingPostId(null);
        }
    };

    // Simple mock calendar grid logic (current week)
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d.toISOString().split('T')[0];
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Calendar Grid */}
            <div className="lg:col-span-3 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Content Calendar</h2>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm">Week View</Button>
                        <Button variant="ghost" size="sm">Month View</Button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-4 min-h-[400px]">
                    {days.map(date => {
                        const dateObj = new Date(date);
                        const postsForDay = initialPosts.filter(p => p.scheduled_date.startsWith(date));
                        const isSelected = selectedDate === date;

                        return (
                            <div
                                key={date}
                                onClick={() => setSelectedDate(date)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, date)}
                                className={`
                                    border rounded-xl p-3 flex flex-col gap-2 transition-all cursor-pointer h-full relative
                                    ${isSelected ? 'bg-violet-500/10 border-violet-500 ring-1 ring-violet-500' : 'bg-[#0A0A0A] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'}
                                    ${draggingPostId ? 'border-dashed border-violet-500/50' : ''}
                                `}
                            >
                                <div className="text-xs font-bold text-[var(--text-secondary)] uppercase pointer-events-none">
                                    {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className="text-lg font-mono font-bold mb-2 pointer-events-none">
                                    {dateObj.getDate()}
                                </div>

                                {postsForDay.map(post => (
                                    <div
                                        key={post.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, post.id)}
                                        className="text-[10px] bg-white/10 p-1.5 rounded border border-white/5 truncate cursor-grab active:cursor-grabbing hover:bg-violet-600 hover:text-white transition-colors"
                                    >
                                        {post.account?.platform === 'instagram' && '📸 '}
                                        {post.account?.platform === 'linkedin' && '💼 '}
                                        {post.content}
                                    </div>
                                ))}

                                <div className="mt-auto pt-2 opacity-0 hover:opacity-100 transition-opacity">
                                    <div className="text-[10px] text-center text-violet-400 bg-violet-500/10 rounded py-1">+ Add</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Editor Sidebar */}
            <div className="lg:col-span-1">
                <Card className="sticky top-8">
                    <h3 className="font-bold flex items-center gap-2 mb-6">
                        <Plus size={16} /> New Post
                    </h3>

                    <form action={createSocialPost} className="space-y-4">
                        <div>
                            <label className="text-xs uppercase text-[var(--text-tertiary)] font-bold">Date</label>
                            <input type="date" name="date" defaultValue={selectedDate} className="pro-input w-full mt-1" required />
                        </div>

                        <div>
                            <label className="text-xs uppercase text-[var(--text-tertiary)] font-bold">Account</label>
                            <div className="flex gap-2 mt-1 overflow-x-auto pb-2">
                                {accounts.map(acc => (
                                    <label key={acc.id} className="cursor-pointer">
                                        <input type="radio" name="accountId" value={acc.id} className="peer sr-only" required />
                                        <div className="w-10 h-10 rounded-full border border-[var(--border-subtle)] peer-checked:border-violet-500 peer-checked:ring-2 peer-checked:ring-violet-500/50 grayscale peer-checked:grayscale-0 transition-all overflow-hidden">
                                            <img src={acc.avatar_url} alt={acc.handle} className="w-full h-full object-cover" />
                                        </div>
                                    </label>
                                ))}
                                {accounts.length === 0 && <div className="text-xs text-[var(--text-tertiary)]">Connect an account first</div>}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs uppercase text-[var(--text-tertiary)] font-bold">Content</label>
                            <textarea name="content" className="pro-input w-full mt-1 min-h-[100px]" placeholder="Write your caption..." required></textarea>
                        </div>

                        <div>
                            <label className="text-xs uppercase text-[var(--text-tertiary)] font-bold">Time</label>
                            <input type="time" name="time" defaultValue="10:00" className="pro-input w-full mt-1" required />
                        </div>

                        <div className="pt-2">
                            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white">
                                Schedule Post
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
