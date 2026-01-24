
import { getTeamMember, getMemberAvailability, getMemberFinancials, updateTeamMember } from '@/app/actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Mail, Phone, Calendar as CalendarIcon, DollarSign, Briefcase } from 'lucide-react';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const memberId = Number(id);
    const member = await getTeamMember(memberId) as any;

    if (!member) return notFound();

    const availability = await getMemberAvailability(memberId) as any[];
    const financials = await getMemberFinancials(memberId) as any[];

    const totalEarnings = financials.reduce((acc, curr) => acc + (curr.rate_value || 0), 0);

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <header className="mb-8 border-b border-[var(--border-subtle)] pb-6 flex items-center justify-between">
                <div>
                    <Link href="/team" className="text-xs text-[var(--text-tertiary)] hover:text-white mb-2 block font-mono">
                        ← BACK TO TEAM
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        {member.name}
                        <span className="text-sm bg-white/10 px-3 py-1 rounded-full font-normal border border-white/10 text-[var(--text-secondary)]">
                            {member.role || 'Member'}
                        </span>
                    </h1>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Profile & Stats */}
                <div className="space-y-8">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-4 rounded-xl">
                            <div className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider mb-1">Total Earnings</div>
                            <div className="text-2xl font-bold font-mono text-emerald-400">${totalEarnings.toLocaleString()}</div>
                        </div>
                        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-4 rounded-xl">
                            <div className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider mb-1">Projects</div>
                            <div className="text-2xl font-bold font-mono text-white">{financials.length}</div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><Briefcase size={16} /> Profile Details</h3>
                        <form action={updateTeamMember} className="space-y-4">
                            <input type="hidden" name="id" value={member.id} />

                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Full Name</label>
                                <input name="name" type="text" defaultValue={member.name} className="pro-input w-full" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Role</label>
                                <input name="role" type="text" defaultValue={member.role} className="pro-input w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Email</label>
                                <input name="email" type="email" defaultValue={member.email} className="pro-input w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Phone</label>
                                <input name="phone" type="tel" defaultValue={member.phone} className="pro-input w-full" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Display Color</label>
                                <select name="color" defaultValue={member.color || 'indigo'} className="pro-input w-full">
                                    <option value="indigo">Indigo</option>
                                    <option value="emerald">Emerald</option>
                                    <option value="violet">Violet</option>
                                    <option value="rose">Rose</option>
                                    <option value="blue">Blue</option>
                                    <option value="orange">Orange</option>
                                </select>
                            </div>

                            <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-lg transition-colors mt-2 text-sm">
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Col: Availability & Financial History */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Availability */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarIcon size={18} className="text-[var(--text-tertiary)]" />
                            <h2 className="text-lg font-bold">Availability</h2>
                        </div>
                        <AvailabilityCalendar memberId={member.id} availability={availability} />
                    </div>

                    {/* Financial History */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign size={18} className="text-[var(--text-tertiary)]" />
                            <h2 className="text-lg font-bold">Project History & Earnings</h2>
                        </div>
                        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-[var(--text-tertiary)] uppercase text-xs font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Project / Task</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                    {financials.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white">{item.project_title || 'Direct Commission'}</div>
                                                <div className="text-xs text-[var(--text-secondary)]">{item.client_name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--text-secondary)]">
                                                {item.role_name} ({item.rate_type})
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                                                ${item.rate_value.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {financials.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-[var(--text-tertiary)]">
                                                No financial records found tied to &quot;{member.name}&quot;.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
