'use client';

import React, { useState, useTransition } from 'react';
import { Client, TeamMember } from '@/types';
import { updateClient } from '@/app/actions';
import { MapPin, Globe, User, Save, X, Edit2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ClientProfileEditorProps {
    client: Client;
    teamMembers: TeamMember[];
}

export default function ClientProfileEditor({ client, teamMembers }: ClientProfileEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [location, setLocation] = useState(client.location || '');
    const [website, setWebsite] = useState(client.website || '');
    const [about, setAbout] = useState(client.about || '');
    const [assignedMemberId, setAssignedMemberId] = useState<number | ''>(client.assigned_team_member_id || '');

    const handleSave = () => {
        startTransition(async () => {
            const formData = new FormData();

            // Required base fields
            formData.append('id', client.id.toString());
            formData.append('name', client.name);
            formData.append('company', client.company_name);
            formData.append('plan', client.plan);
            formData.append('status', client.status);
            if (client.agency_id) formData.append('agencyId', client.agency_id.toString());

            // New profile fields
            formData.append('location', location);
            formData.append('website', website);
            formData.append('about', about);
            if (assignedMemberId) formData.append('assigned_team_member_id', assignedMemberId.toString());

            try {
                await updateClient(formData);
                toast.success('Client profile updated');
                setIsEditing(false);
            } catch (err) {
                toast.error('Failed to update profile');
            }
        });
    };

    const assignedMember = teamMembers.find(m => m.id === client.assigned_team_member_id);

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] p-6 rounded-2xl relative">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Client Profile</h3>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1.5 transition-colors"
                    >
                        <Edit2 size={14} /> Edit
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                            Save
                        </button>
                        <button
                            onClick={() => {
                                setLocation(client.location || '');
                                setWebsite(client.website || '');
                                setAbout(client.about || '');
                                setAssignedMemberId(client.assigned_team_member_id || '');
                                setIsEditing(false);
                            }}
                            disabled={isPending}
                            className="text-[var(--text-secondary)] hover:text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors"
                        >
                            <X size={14} /> Cancel
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {/* Location */}
                <div className="flex gap-3 items-start p-3 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-[var(--border-subtle)]">
                    <MapPin className="text-[var(--text-tertiary)] shrink-0 mt-0.5" size={16} />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-[var(--text-secondary)] mb-1">Location</div>
                        {isEditing ? (
                            <input
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                className="w-full bg-[#111] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                placeholder="e.g. New York, NY"
                            />
                        ) : (
                            <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {client.location || <span className="text-[var(--text-tertiary)] italic">Not set</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Website */}
                <div className="flex gap-3 items-start p-3 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-[var(--border-subtle)]">
                    <Globe className="text-[var(--text-tertiary)] shrink-0 mt-0.5" size={16} />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-[var(--text-secondary)] mb-1">Website</div>
                        {isEditing ? (
                            <input
                                value={website}
                                onChange={e => setWebsite(e.target.value)}
                                className="w-full bg-[#111] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                placeholder="https://example.com"
                            />
                        ) : (
                            <div className="text-sm font-medium text-[var(--text-primary)] truncate flex items-center gap-2">
                                {client.website ? (
                                    <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                                        {client.website}
                                    </a>
                                ) : (
                                    <span className="text-[var(--text-tertiary)] italic">Not set</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Assigned Team Member */}
                <div className="flex gap-3 items-start p-3 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-[var(--border-subtle)]">
                    <User className="text-[var(--text-tertiary)] shrink-0 mt-0.5" size={16} />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-[var(--text-secondary)] mb-1">Assigned Account Manager</div>
                        {isEditing ? (
                            <select
                                value={assignedMemberId}
                                onChange={e => setAssignedMemberId(e.target.value ? Number(e.target.value) : '')}
                                className="w-full bg-[#111] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                            >
                                <option value="">-- None --</option>
                                {teamMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                                {assignedMember ? (
                                    <>
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: assignedMember.color + '40', color: assignedMember.color }}>
                                            {assignedMember.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span>{assignedMember.name}</span>
                                    </>
                                ) : (
                                    <span className="text-[var(--text-tertiary)] italic">Unassigned</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* About Section */}
                <div className="p-3 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-[var(--border-subtle)]">
                    <div className="text-xs text-[var(--text-secondary)] mb-2">About / Notes</div>
                    {isEditing ? (
                        <textarea
                            value={about}
                            onChange={e => setAbout(e.target.value)}
                            className="w-full bg-[#111] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors min-h-[100px] resize-y custom-scrollbar"
                            placeholder="Add notes about the client, their preferences, or history..."
                        />
                    ) : (
                        <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                            {client.about || <span className="text-[var(--text-tertiary)] italic">No notes added.</span>}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
