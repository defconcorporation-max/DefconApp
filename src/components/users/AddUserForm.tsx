'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { createUser } from '@/app/user-actions';

interface AddUserFormProps {
    roles: { value: string; label: string; description: string }[];
    agencies: { id: number; name: string }[];
}

export default function AddUserForm({ roles, agencies }: AddUserFormProps) {
    const [selectedRole, setSelectedRole] = useState(roles[0].value);

    const isAgencyRole = selectedRole === 'AgencyAdmin' || selectedRole === 'AgencyTeam';

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 mb-8">
            <h2 className="text-white font-medium mb-4 flex items-center gap-2">
                <UserPlus size={18} />
                Add New User
            </h2>
            <form action={async (formData) => {
                await createUser(formData);
                // Optional: reset form or show success
            }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Full Name</label>
                    <input
                        name="name"
                        type="text"
                        required
                        placeholder="John Doe"
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Email</label>
                    <input
                        name="email"
                        type="email"
                        required
                        placeholder="john@defcon.com"
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Password</label>
                    <input
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        placeholder="Min. 6 characters"
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Role</label>
                    <select
                        name="role"
                        required
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none appearance-none"
                    >
                        {roles.map(r => (
                            <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                        ))}
                    </select>
                </div>

                {/* Conditional Agency Selector */}
                {isAgencyRole && (
                    <div className="space-y-1.5 md:col-span-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">Link to Agency (Required)</label>
                        <select
                            name="agencyId"
                            required
                            className="w-full bg-[var(--bg-surface)] border border-amber-500/50 rounded px-3 py-2 text-sm text-white focus:border-amber-500 outline-none appearance-none"
                        >
                            <option value="">-- Select Agency --</option>
                            {agencies.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="md:col-span-2 flex justify-end">
                    <button
                        type="submit"
                        className="bg-white text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <UserPlus size={16} />
                        Create User
                    </button>
                </div>
            </form>
        </div>
    );
}
