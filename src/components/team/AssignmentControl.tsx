'use client';

import { useState } from 'react';
import { ShootAssignment, TeamMember } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, X, User } from 'lucide-react';
import { assignMemberToShoot, removeAssignment } from '@/app/team-actions';

interface Props {
    shootId: number;
    assignments: ShootAssignment[];
    allMembers: TeamMember[];
}

export default function AssignmentControl({ shootId, assignments, allMembers }: Props) {
    const [isAdding, setIsAdding] = useState(false);

    // Filter out already assigned members
    const assignedIds = new Set(assignments.map(a => a.team_member_id));
    const availableMembers = allMembers.filter(m => !assignedIds.has(m.id));

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-white">Crew & Assignments</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(!isAdding)}>
                    <Plus size={16} className="mr-2" />
                    Assign Crew
                </Button>
            </div>

            {isAdding && (
                <div className="mb-4 p-4 bg-[#151515] rounded-lg border border-[var(--border-subtle)] animate-in fade-in slide-in-from-top-2">
                    <form action={async (formData) => {
                        await assignMemberToShoot(formData);
                        setIsAdding(false);
                    }} className="flex gap-2">
                        <input type="hidden" name="shootId" value={shootId} />
                        <select name="memberId" required className="flex-1 bg-black border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none">
                            <option value="">Select Team Member...</option>
                            {availableMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                            ))}
                        </select>
                        <input name="role" placeholder="Role (optional)" className="w-1/3 bg-black border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
                        <Button type="submit" size="sm" className="bg-indigo-600 text-white">Add</Button>
                    </form>
                </div>
            )}

            <div className="space-y-3">
                {assignments.map(a => (
                    <div key={a.id} className="flex justify-between items-center bg-[#151515] p-3 rounded-lg border border-[var(--border-subtle)] group">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-${a.member_avatar_color || 'gray'}-500/20 text-${a.member_avatar_color || 'gray'}-400`}>
                                {(a.member_name || '?').charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{a.member_name}</p>
                                <p className="text-xs text-[var(--text-tertiary)]">{a.role}</p>
                            </div>
                        </div>
                        <form action={removeAssignment}>
                            <input type="hidden" name="assignmentId" value={a.id} />
                            <input type="hidden" name="shootId" value={shootId} />
                            <button className="text-[var(--text-tertiary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                <X size={16} />
                            </button>
                        </form>
                    </div>
                ))}

                {assignments.length === 0 && !isAdding && (
                    <p className="text-sm text-[var(--text-tertiary)] italic">No crew assigned yet.</p>
                )}
            </div>
        </div>
    );
}
