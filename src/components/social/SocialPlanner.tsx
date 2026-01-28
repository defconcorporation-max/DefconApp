'use client';

import { SocialPost, SocialAccount, Client } from '@/types';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { createSocialPost, updateSocialPost, deleteSocialPost } from '@/app/social-actions';
import { Plus, Calendar as CalendarIcon, Image as ImageIcon, Briefcase, Filter, Trash2, Save, X } from 'lucide-react';

interface PlannerProps {
    initialPosts: SocialPost[];
    accounts: SocialAccount[];
    clients: Client[];
}

export default function SocialPlanner({ initialPosts, accounts, clients }: PlannerProps) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [filterClientId, setFilterClientId] = useState<number | 'all'>('all');
    const [draggingPostId, setDraggingPostId] = useState<number | null>(null);

    // Edit State
    const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter posts
    const filteredPosts = initialPosts.filter(p => {
        if (filterClientId === 'all') return true;
        return p.account?.client_id === filterClientId;
    });

    // Filter accounts for the dropdown
    const filteredAccounts = accounts.filter(a => {
        if (filterClientId === 'all') return true;
        return a.client_id === filterClientId;
    });

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

            await updateSocialPost(draggingPostId, newDateTime, originalPost.content);
            setDraggingPostId(null);
        }
    };

    const handlePostClick = (post: SocialPost) => {
        setEditingPost(post);
        setSelectedDate(post.scheduled_date.split('T')[0]);
    };

    const handleSave = async (formData: FormData) => {
        setIsSubmitting(true);
        if (editingPost) {
            // Update existing
            const date = formData.get('date') as string;
            const time = formData.get('time') as string;
            const content = formData.get('content') as string;
            const scheduledDate = `${date}T${time}:00`;

            await updateSocialPost(editingPost.id, scheduledDate, content);
            setEditingPost(null);
        } else {
            // Create new
            await createSocialPost(formData);
        }
        setIsSubmitting(false);
    };

    const handleDelete = async () => {
        if (!editingPost) return;
        if (confirm('Are you sure you want to delete this post?')) {
            setIsSubmitting(true);
            await deleteSocialPost(editingPost.id);
            setEditingPost(null);
            setIsSubmitting(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingPost(null);
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
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold">Content Calendar</h2>

                        {/* Client Filter */}
                        <div className="flex items-center bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-lg px-2 py-1">
                            <Filter size={14} className="text-[var(--text-tertiary)] mr-2" />
                            <select
                                className="bg-transparent text-sm text-white focus:outline-none"
                                value={filterClientId}
                                onChange={(e) => setFilterClientId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            >
                                <option value="all">All Clients</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.company_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm">Week View</Button>
                        <Button variant="ghost" size="sm">Month View</Button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-4 min-h-[400px]">
                    {days.map(date => {
                        const dateObj = new Date(date);
                        const postsForDay = filteredPosts.filter(p => p.scheduled_date.startsWith(date));
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

                                {postsForDay.map(post => {
                                    const client = clients.find(c => c.id === post.account?.client_id);
                                    const isEditing = editingPost?.id === post.id;

                                    return (
                                        <div
                                            key={post.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, post.id)}
                                            onClick={(e) => { e.stopPropagation(); handlePostClick(post); }}
                                            className={`
                                                text-[10px] p-1.5 rounded border truncate cursor-grab active:cursor-grabbing transition-colors group relative mb-1
                                                ${isEditing
                                                    ? 'bg-violet-600 text-white border-violet-400 ring-1 ring-white'
                                                    : 'bg-white/10 border-white/5 hover:bg-violet-600 hover:text-white'}
                                            `}
                                            title={client?.company_name}
                                        >
                                            <span className="opacity-50 mr-1">
                                                {post.account?.platform === 'instagram' && '📸'}
                                                {post.account?.platform === 'linkedin' && '💼'}
                                                {post.account?.platform === 'facebook' && 'fb'}
                                            </span>
                                            {post.content}
                                            {client && (
                                                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 ring-1 ring-black" title={client.company_name}></div>
                                            )}
                                        </div>
                                    );
                                })}

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
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold flex items-center gap-2">
                            {editingPost ? <Save size={16} className="text-violet-400" /> : <Plus size={16} />}
                            {editingPost ? 'Edit Post' : 'New Post'}
                        </h3>
                        {editingPost && (
                            <button onClick={handleCancelEdit} className="text-[var(--text-tertiary)] hover:text-white">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <form action={handleSave} className="space-y-4">
                        <div>
                            <label className="text-xs uppercase text-[var(--text-tertiary)] font-bold">Date</label>
                            <input
                                type="date"
                                name="date"
                                defaultValue={selectedDate} // This updates when clicking a day
                                key={selectedDate} // Force re-render when date changes
                                className="pro-input w-full mt-1"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs uppercase text-[var(--text-tertiary)] font-bold">Account</label>
                            <div className="flex gap-2 mt-1 overflow-x-auto pb-2">
                                {filteredAccounts.map(acc => (
                                    <label key={acc.id} className="cursor-pointer">
                                        <input
                                            type="radio"
                                            name="accountId"
                                            value={acc.id}
                                            defaultChecked={editingPost ? editingPost.account_id === acc.id : false}
                                            className="peer sr-only"
                                            required
                                        />
                                        <div className="w-10 h-10 rounded-full border border-[var(--border-subtle)] peer-checked:border-violet-500 peer-checked:ring-2 peer-checked:ring-violet-500/50 grayscale peer-checked:grayscale-0 transition-all overflow-hidden relative">
                                            <img src={acc.avatar_url} alt={acc.handle} className="w-full h-full object-cover" />
                                        </div>
                                    </label>
                                ))}
                                {filteredAccounts.length === 0 && <div className="text-xs text-[var(--text-tertiary)]">
                                    {accounts.length > 0 ? "No accounts for this client" : "Connect an account first"}
                                </div>}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs uppercase text-[var(--text-tertiary)] font-bold">Content</label>
                            <textarea
                                name="content"
                                defaultValue={editingPost?.content || ''}
                                key={editingPost?.id || 'new'} // Force re-render
                                className="pro-input w-full mt-1 min-h-[100px]"
                                placeholder="Write your caption..."
                                required
                            ></textarea>
                        </div>

                        <div>
                            <label className="text-xs uppercase text-[var(--text-tertiary)] font-bold">Time</label>
                            <input
                                type="time"
                                name="time"
                                defaultValue={editingPost ? (editingPost.scheduled_date.split('T')[1] || '10:00').slice(0, 5) : '10:00'}
                                key={editingPost?.id || 'new-time'}
                                className="pro-input w-full mt-1"
                                required
                            />
                        </div>

                        <div className="pt-2 grid grid-cols-2 gap-2">
                            {editingPost && (
                                <Button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                    className="w-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20"
                                >
                                    <Trash2 size={16} className="mr-2" /> Delete
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full bg-violet-600 hover:bg-violet-500 text-white ${editingPost ? '' : 'col-span-2'}`}
                            >
                                {editingPost ? 'Save Changes' : 'Schedule Post'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
