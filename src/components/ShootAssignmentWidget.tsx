'use client';

import { createShootAssignment, deleteShootAssignment } from '@/app/actions';
import { ShootAssignment, TeamMember } from '@/types';
import { Plus, X, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface Props {
    shootId: number;
    assignments: ShootAssignment[];
    teamMembers: TeamMember[];
}

export default function ShootAssignmentWidget({ shootId, assignments, teamMembers }: Props) {
    const [isAdding, setIsAdding] = useState(false);

    // Filter out already assigned members
    const availableMembers = teamMembers.filter(
        tm => !assignments.some(a => a.member_id === tm.id)
    );

    return (
        <div className="mt-4 pt-3 border-t border-white/5">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                Crew & Assignments
            </h4>

            <div className="flex flex-wrap gap-2 mb-2">
                {assignments.map(assignment => (
                    <div key={assignment.id} className="group relative flex items-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-full pl-1 pr-3 py-1 transition-all">
                        <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 text-white"
                            style={{ backgroundColor: assignment.member_avatar_color || 'var(--color-primary)' }}
                        >
                            {(assignment.member_name || '?').charAt(0)}
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-xs font-medium text-gray-200">{assignment.member_name}</span>
                            {assignment.role && <span className="text-[9px] text-gray-500">{assignment.role}</span>}
                        </div>

                        <form action={deleteShootAssignment} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <input type="hidden" name="id" value={assignment.id} />
                            <input type="hidden" name="shootId" value={shootId} />
                            <button className="bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                                <X size={10} />
                            </button>
                        </form>
                    </div>
                ))}

                {isAdding ? (
                    <form action={(formData) => {
                        createShootAssignment(formData);
                        setIsAdding(false);
                    }} className="flex items-center gap-2 bg-black/40 rounded-full border border-violet-500/50 p-1 pl-2 animate-in fade-in slide-in-from-left-2">
                        <select name="memberId" className="bg-transparent text-xs text-white focus:outline-none w-24" required autoFocus>
                            <option value="">Select Member...</option>
                            {availableMembers.map(m => (
                                <option key={m.id} value={m.id} className="text-black">{m.name}</option>
                            ))}
                        </select>
                        <select name="role" className="bg-transparent text-xs text-gray-400 focus:outline-none w-20">
                            <option value="">Role...</option>
                            <option value="Lead" className="text-black">Lead</option>
                            <option value="Second" className="text-black">Second</option>
                            <option value="Assistant" className="text-black">Assistant</option>
                            <option value="Editor" className="text-black">Editor</option>
                        </select>
                        <input type="hidden" name="shootId" value={shootId} />
                        <button className="bg-violet-600 hover:bg-violet-700 text-white rounded-full p-1">
                            <Plus size={12} />
                        </button>
                        <button type="button" onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white px-1">
                            <X size={12} />
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-400 border border-dashed border-gray-700 hover:border-violet-500/50 rounded-full px-3 py-1 transition-all"
                    >
                        <UserPlus size={12} />
                        <span>Assign</span>
                    </button>
                )}
            </div>
        </div>
    );
}
