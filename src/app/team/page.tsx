
import { getTeamMembers, addTeamMember } from '@/app/actions';
import Link from 'next/link';
import { UserPlus, Users, Phone, Mail, ArrowRight } from 'lucide-react';
import { revalidatePath } from 'next/cache';


export const dynamic = 'force-dynamic';

export default async function TeamPage() {
    const members = await getTeamMembers();

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <header className="mb-8 border-b border-[var(--border-subtle)] pb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Team Management</h1>
                    <p className="text-[var(--text-secondary)] text-sm">Manage your team, availability, and roles.</p>
                </div>
                <Link href="/" className="text-sm font-mono text-[var(--text-tertiary)] hover:text-white transition-colors">
                    ← BACK TO DASHBOARD
                </Link>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Team List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-sm uppercase tracking-wider text-[var(--text-tertiary)] font-bold mb-4">Team Members</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {members.map((member: any) => (
                            <Link href={`/team/${member.id}`} key={member.id} className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl hover:border-violet-500/50 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-${member.color || 'indigo'}-500/20 text-${member.color || 'indigo'}-400`}>
                                        {member.name.charAt(0)}
                                    </div>
                                    <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[var(--text-secondary)]">
                                        {member.role || 'Member'}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg mb-1 group-hover:text-violet-400 transition-colors">{member.name}</h3>
                                <div className="space-y-1 text-sm text-[var(--text-tertiary)]">
                                    {member.email && <div className="flex items-center gap-2"><Mail size={14} /> {member.email}</div>}
                                    {member.phone && <div className="flex items-center gap-2"><Phone size={14} /> {member.phone}</div>}
                                </div>
                            </Link>
                        ))}

                        {members.length === 0 && (
                            <div className="col-span-2 text-center p-12 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl text-[var(--text-tertiary)]">
                                No team members found. Add one on the right.
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Member Form */}
                <div>
                    <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl sticky top-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                <UserPlus size={20} />
                            </div>
                            <h3 className="font-bold">Add Team Member</h3>
                        </div>

                        <form action={addTeamMember} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Full Name</label>
                                <input name="name" type="text" className="pro-input w-full" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Role</label>
                                <input name="role" type="text" placeholder="e.g. Editor" className="pro-input w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Hourly Rate ($)</label>
                                <input name="hourly_rate" type="number" step="0.01" className="pro-input w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Email</label>
                                <input name="email" type="email" className="pro-input w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Phone</label>
                                <input name="phone" type="tel" className="pro-input w-full" />
                            </div>

                            <button className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors mt-2">
                                Create Member
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
