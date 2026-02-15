import { getUsers, createUser, updateUserRole, deleteUser, resetUserPassword } from '@/app/user-actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, UserPlus, Trash2, Key, Users } from 'lucide-react';
import RoleSelector from '@/components/RoleSelector';

export const dynamic = 'force-dynamic';

const ROLES = [
    { value: 'Admin', label: 'Admin', description: 'Full access to everything', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { value: 'Team', label: 'Team', description: 'Manage shoots, clients, projects', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { value: 'AgencyAdmin', label: 'Agency Admin', description: 'Agency-level management', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { value: 'AgencyTeam', label: 'Agency Team', description: 'Agency team member', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { value: 'Client', label: 'Client', description: 'Client portal access only', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
];

export default async function UsersPage() {
    const users = await getUsers();

    async function handleCreateUser(formData: FormData) {
        'use server';
        await createUser(formData);
        redirect('/users');
    }

    async function handleUpdateRole(formData: FormData) {
        'use server';
        await updateUserRole(formData);
        redirect('/users');
    }

    async function handleDeleteUser(formData: FormData) {
        'use server';
        await deleteUser(formData);
        redirect('/users');
    }

    async function handleResetPassword(formData: FormData) {
        'use server';
        await resetUserPassword(formData);
        redirect('/users');
    }

    return (
        <main className="min-h-screen bg-[var(--bg-root)] p-8">
            <Link href="/" className="inline-flex items-center text-sm text-[var(--text-tertiary)] hover:text-white mb-6 transition-colors">
                ← Back to Dashboard
            </Link>

            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-medium text-white tracking-tight flex items-center gap-3">
                            <Users size={28} />
                            Users
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-1">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
                    </div>
                </header>

                {/* Add New User Form */}
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 mb-8">
                    <h2 className="text-white font-medium mb-4 flex items-center gap-2">
                        <UserPlus size={18} />
                        Add New User
                    </h2>
                    <form action={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none appearance-none"
                            >
                                {ROLES.map(r => (
                                    <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                                ))}
                            </select>
                        </div>
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

                {/* Users List */}
                <div className="space-y-3">
                    {users.map((user: any) => (
                        <div key={user.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--text-tertiary)] transition-colors group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">{user.name}</h3>
                                        <p className="text-xs text-[var(--text-tertiary)]">{user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Role Selector */}
                                    <RoleSelector
                                        userId={user.id}
                                        currentRole={user.role}
                                        roles={ROLES.map(r => ({ value: r.value, label: r.label }))}
                                        updateAction={handleUpdateRole}
                                    />

                                    {/* Reset Password */}
                                    <form action={handleResetPassword} className="flex items-center gap-1">
                                        <input type="hidden" name="userId" value={user.id} />
                                        <input
                                            name="newPassword"
                                            type="password"
                                            placeholder="New pwd"
                                            minLength={6}
                                            className="w-24 bg-transparent border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-white focus:border-amber-500 outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                                        />
                                        <button type="submit" className="p-1 text-[var(--text-tertiary)] hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Reset Password">
                                            <Key size={14} />
                                        </button>
                                    </form>

                                    {/* Delete User */}
                                    {user.id !== 1 && (
                                        <form action={handleDeleteUser}>
                                            <input type="hidden" name="userId" value={user.id} />
                                            <button type="submit" className="p-1 text-[var(--text-tertiary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete User">
                                                <Trash2 size={14} />
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>

                            {/* Role Info */}
                            <div className="mt-3 flex items-center gap-4">
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${ROLES.find(r => r.value === user.role)?.color || 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                                    {ROLES.find(r => r.value === user.role)?.label || user.role}
                                </span>
                                <span className="text-[10px] text-[var(--text-tertiary)]">
                                    Joined {new Date(user.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Role Reference */}
                <div className="mt-10 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <Shield size={16} />
                        Role Reference
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ROLES.map(r => (
                            <div key={r.value} className={`px-4 py-3 rounded-lg border ${r.color}`}>
                                <p className="font-bold text-sm">{r.label}</p>
                                <p className="text-xs opacity-70 mt-0.5">{r.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
