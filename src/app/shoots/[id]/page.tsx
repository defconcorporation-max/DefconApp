import { getShootById, updateShoot, deleteShoot, getClients, getShootVideos, addShootVideo, toggleShootVideo, updateShootVideoNotes, deleteShootVideo, getShootVideoNotes, addShootVideoNote, deleteShootVideoNote, finishShoot, revertShoot, getProjects } from '@/app/actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import FinishShootButton from '@/components/FinishShootButton';
import { getPostProdTemplates } from '@/app/post-prod-actions';
import PostProdTrigger from '@/components/post-prod/PostProdTrigger';
import { getShootAssignments } from '@/app/actions';
export const dynamic = 'force-dynamic';
import { getTeamMembers } from '@/app/actions';
import AssignmentControl from '@/components/team/AssignmentControl';
import NotesEditor from '@/components/NotesEditor';
import VideoTitleEditor from '@/components/VideoTitleEditor';
import CreativeDirector from '@/components/shoot/CreativeDirector';
import ShootPlanPDF from '@/components/shoot/ShootPlanPDF';



export default async function ShootPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const shootId = parseInt(id);
    const shoot = await getShootById(shootId);

    if (!shoot) {
        return (
            <div className="min-h-screen bg-[var(--bg-root)] p-8 text-white flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Shoot Not Found (ID: {id})</h1>
                <Link href="/" className="text-[var(--text-secondary)] hover:text-white underline">Return to Dashboard</Link>
            </div>
        );
    }

    const clients = await getClients();
    const videos = await getShootVideos(shootId);
    const notes = await getShootVideoNotes(shootId);
    const projects = await getProjects(shoot.client_id);
    const templates = await getPostProdTemplates();
    const assignments = await getShootAssignments(shootId);
    const allMembers = await getTeamMembers();

    // Helper for Time Slots
    const START_HOUR = 7;
    const END_HOUR = 22;
    const timeSlots = Array.from({ length: (END_HOUR - START_HOUR + 1) * 2 }, (_, i) => {
        const hour = Math.floor(i / 2) + START_HOUR;
        const minute = i % 2 === 0 ? '00' : '30';
        return `${hour.toString().padStart(2, '0')}:${minute}`;
    });

    // Available colors (matching DashboardCalendar)
    const COLORS = [
        { name: 'Indigo', value: 'indigo', dot: 'bg-indigo-500' },
        { name: 'Emerald', value: 'emerald', dot: 'bg-emerald-500' },
        { name: 'Rose', value: 'rose', dot: 'bg-rose-500' },
        { name: 'Amber', value: 'amber', dot: 'bg-amber-500' },
        { name: 'Sky', value: 'sky', dot: 'bg-sky-500' },
        { name: 'Violet', value: 'violet', dot: 'bg-violet-500' },
        { name: 'Fuchsia', value: 'fuchsia', dot: 'bg-fuchsia-500' },
        { name: 'Slate', value: 'slate', dot: 'bg-slate-500' },
    ];

    async function handleAddVideo(formData: FormData) {
        'use server';
        await addShootVideo(formData);
        redirect(`/shoots/${shootId}`);
    }

    async function handleDeleteVideo(formData: FormData) {
        'use server';
        await deleteShootVideo(formData);
        redirect(`/shoots/${shootId}`);
    }

    async function handleToggleVideo(formData: FormData) {
        'use server';
        const id = parseInt(formData.get('id') as string);
        const currentStatus = parseInt(formData.get('status') as string);
        const clientId = parseInt(formData.get('clientId') as string);
        await toggleShootVideo(id, currentStatus, clientId);
        redirect(`/shoots/${shootId}`);
    }

    async function handleUpdateNotes(formData: FormData) {
        'use server';
        // Legacy helper, maybe not needed if we fully moved to list, but keep for now if needed or remove
        const id = parseInt(formData.get('id') as string);
        const notes = formData.get('notes') as string;
        const clientId = parseInt(formData.get('clientId') as string);
        await updateShootVideoNotes(id, notes, clientId, shootId);
        redirect(`/shoots/${shootId}`);
    }

    async function handleAddNote(formData: FormData) {
        'use server';
        formData.append('shootId', shootId.toString());
        await addShootVideoNote(formData);
        redirect(`/shoots/${shootId}`);
    }

    async function handleDeleteNote(formData: FormData) {
        'use server';
        formData.append('shootId', shootId.toString());
        await deleteShootVideoNote(formData);
        redirect(`/shoots/${shootId}`);
    }

    // Client Component for Notes (Inline Editing) could be better, but Server Actions with onBlur form submission is simplest for now.
    // Or just a save button.

    return (
        <main className="min-h-screen bg-[var(--bg-root)] p-8">
            <Link
                href={shoot.project_id ? `/projects/${shoot.project_id}?tab=shoots` : `/clients/${shoot.client_id}`}
                className="inline-flex items-center text-sm text-[var(--text-tertiary)] hover:text-white mb-6 transition-colors"
            >
                ← Back to {shoot.project_title ? `Project: ${shoot.project_title}` : `Client: ${shoot.client_company || shoot.client_name}`}
            </Link>

            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content: Shot List */}
                <div className="lg:col-span-2 space-y-8">
                    <header className="border-b border-[var(--border-subtle)] pb-6">
                        <h1 className="text-3xl font-medium text-white tracking-tight mb-2">{shoot.title}</h1>
                        <div className="flex items-center gap-4">
                            <span className="text-[var(--text-secondary)] flex items-center gap-2">
                                <Link href={`/clients/${shoot.client_id}`} className="hover:text-white transition-colors hover:underline">
                                    {shoot.client_company || shoot.client_name}
                                </Link>
                                {shoot.project_title && (
                                    <>
                                        <span className="text-[var(--text-tertiary)]">•</span>
                                        <Link href={`/projects/${shoot.project_id}`} className="text-[var(--text-tertiary)] hover:text-white transition-colors hover:underline">
                                            {shoot.project_title}
                                        </Link>
                                    </>
                                )}
                            </span>
                            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border items-center gap-1.5 flex uppercase tracking-wide ${shoot.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                shoot.status === 'Cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${shoot.status === 'Completed' ? 'bg-emerald-500' : shoot.status === 'Cancelled' ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                                {shoot.status || 'Scheduled'}
                            </div>
                            <ShootPlanPDF
                                shootId={shoot.id}
                                shootTitle={shoot.title}
                                clientName={shoot.client_company || shoot.client_name}
                                shootDate={shoot.shoot_date}
                                concept={shoot.concept || undefined}
                                mood={shoot.mood || undefined}
                                shotList={shoot.shot_list || undefined}
                            />
                        </div>
                    </header>

                    <div className="mb-6">
                        <AssignmentControl
                            shootId={shoot.id}
                            assignments={assignments}
                            allMembers={allMembers}
                        />
                    </div>

                    <CreativeDirector shoot={shoot} />


                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium text-white">Video Deliverables</h2>
                            <span className="text-xs text-[var(--text-tertiary)]">{videos.filter(v => v.completed).length}/{videos.length} Completed</span>
                        </div>

                        <div className="space-y-3">
                            {videos.map(video => (
                                <div key={video.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-4 transition-all hover:border-[var(--text-tertiary)] group">
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox Form */}
                                        <form action={handleToggleVideo}>
                                            <input type="hidden" name="id" value={video.id} />
                                            <input type="hidden" name="status" value={video.completed ? 1 : 0} />
                                            <input type="hidden" name="clientId" value={shoot.client_id} />
                                            <button
                                                type="submit"
                                                className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${video.completed
                                                    ? 'bg-emerald-500 border-emerald-500 text-black'
                                                    : 'border-[var(--text-tertiary)] hover:border-white text-transparent'
                                                    }`}
                                            >
                                                ✓
                                            </button>
                                        </form>

                                        <div className="flex-1 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <VideoTitleEditor
                                                    videoId={video.id}
                                                    initialTitle={video.title}
                                                    clientId={shoot.client_id}
                                                    shootId={shoot.id}
                                                    completed={video.completed === 1}
                                                />
                                                <form action={handleDeleteVideo}>
                                                    <input type="hidden" name="id" value={video.id} />
                                                    <button type="submit" className="text-[var(--text-tertiary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                        ✕
                                                    </button>
                                                </form>
                                            </div>

                                            {/* Notes / Script area */}
                                            <div className="space-y-1">
                                                {notes.filter(n => n.video_id === video.id).map(note => (
                                                    <div key={note.id} className="text-xs text-[var(--text-secondary)] bg-[var(--bg-root)]/50 px-2 py-1 rounded flex justify-between items-start group/note">
                                                        <NotesEditor
                                                            noteId={note.id}
                                                            initialContent={note.content}
                                                            videoId={video.id}
                                                            clientId={shoot.client_id}
                                                            shootId={shoot.id}
                                                        />
                                                        <form action={handleDeleteNote}>
                                                            <input type="hidden" name="id" value={note.id} />
                                                            <button type="submit" className="text-[var(--text-tertiary)] hover:text-red-400 opacity-0 group-hover/note:opacity-100 transition-opacity ml-2">×</button>
                                                        </form>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add Note Form - textarea for full scripts */}
                                            <form action={handleAddNote} className="flex gap-2">
                                                <input type="hidden" name="videoId" value={video.id} />
                                                <input type="hidden" name="clientId" value={shoot.client_id} />
                                                <div className="relative flex-1">
                                                    <textarea
                                                        name="content"
                                                        placeholder="Add a note or script..."
                                                        className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded px-3 py-2 text-xs text-[var(--text-secondary)] focus:text-white focus:border-[var(--text-secondary)] outline-none transition-colors resize-y min-h-[36px]"
                                                        rows={1}
                                                        required
                                                    />
                                                </div>
                                                <button type="submit" className="text-xs bg-[var(--bg-root)] border border-[var(--border-subtle)] px-3 rounded text-[var(--text-tertiary)] hover:text-white hover:border-[var(--text-secondary)] transition-colors self-start mt-0.5">
                                                    +
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Video Form */}
                        <form action={handleAddVideo} className="mt-4 flex gap-2">
                            <input type="hidden" name="shootId" value={shoot.id} />
                            <input type="hidden" name="clientId" value={shoot.client_id} />
                            <input
                                name="title"
                                type="text"
                                placeholder="+ Add new video deliverable..."
                                className="flex-1 bg-transparent border-b border-[var(--border-subtle)] py-2 text-sm text-white placeholder:text-[var(--text-tertiary)] focus:border-[var(--text-secondary)] outline-none transition-colors"
                                required
                            />
                            <button type="submit" className="text-sm font-medium text-white px-4 py-2 bg-[var(--bg-surface)] rounded hover:bg-[var(--text-primary)] hover:text-black transition-colors">
                                Add
                            </button>
                        </form>
                    </section>
                </div>


                {/* Sidebar: Edit Details */}
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl overflow-hidden p-6 h-fit sticky top-6">
                    <h3 className="text-white font-medium mb-6">Shoot Details</h3>
                    <form action={updateShoot} className="space-y-6">
                        <input type="hidden" name="id" value={shoot.id} />
                        <input type="hidden" name="clientId" value={shoot.client_id} />

                        <div className="space-y-4">
                            {/* Project Select */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Project</label>
                                <select
                                    name="projectId"
                                    defaultValue={shoot.project_id || ''}
                                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-[var(--text-secondary)] outline-none appearance-none"
                                >
                                    <option value="">-- No Project --</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Shoot Title</label>
                                <input name="title" type="text" defaultValue={shoot.title} className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-[var(--text-secondary)] outline-none" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Color Label</label>
                                <div className="flex gap-2 flex-wrap">
                                    {COLORS.map(c => (
                                        <label key={c.value} className="cursor-pointer">
                                            <input
                                                type="radio"
                                                name="color"
                                                value={c.value}
                                                defaultChecked={shoot.color === c.value || (!shoot.color && c.value === 'indigo')}
                                                className="sr-only peer"
                                            />
                                            <div className={`w-5 h-5 rounded-full border border-transparent peer-checked:border-white peer-checked:ring-1 peer-checked:ring-offset-1 peer-checked:ring-offset-black flex items-center justify-center transition-all hover:scale-110`}>
                                                <div className={`w-3.5 h-3.5 rounded-full ${c.dot}`}></div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Date</label>
                                <input name="date" type="date" defaultValue={shoot.shoot_date} className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-[var(--text-secondary)] outline-none" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Due Date</label>
                                <input name="dueDate" type="date" defaultValue={shoot.due_date || ''} className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-[var(--text-secondary)] outline-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Start</label>
                                    <select
                                        name="startTime"
                                        defaultValue={shoot.start_time}
                                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-[var(--text-secondary)] outline-none appearance-none"
                                    >
                                        {timeSlots.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">End</label>
                                    <select
                                        name="endTime"
                                        defaultValue={shoot.end_time || ''}
                                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-[var(--text-secondary)] outline-none appearance-none"
                                    >
                                        <option value="">--</option>
                                        {timeSlots.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-[var(--border-subtle)]">
                            <button type="submit" className="w-full bg-white text-black px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 transition-colors">
                                Save Details
                            </button>
                            <button
                                type="submit"
                                formAction={async (formData) => {
                                    'use server';
                                    await deleteShoot(formData);
                                    redirect('/');
                                }}
                                className="w-full mt-2 text-red-500 hover:text-red-400 text-xs text-center py-1 transition-colors"
                            >
                                Delete Shoot
                            </button>
                        </div>
                    </form>

                    {/* Finish Shoot Action */}
                    <PostProdTrigger
                        shootId={shoot.id}
                        shootStatus={shoot.status}
                        templates={templates}
                        postProdId={shoot.post_prod_id}
                        postProdStatus={shoot.post_prod_status}
                    />

                    {/* Revert Shoot Action */}
                    {(shoot.status === 'Completed' || shoot.post_prod_id) && (
                        <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                            <form
                                action={async () => {
                                    'use server';
                                    await revertShoot(shoot.id);
                                }}
                            >
                                <button
                                    type="submit"
                                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-root)] text-[var(--text-secondary)] font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    ↺ Revert to Shooting
                                </button>
                            </form>
                            <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">
                                Removes from Post-Production and marks as planned.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
}
