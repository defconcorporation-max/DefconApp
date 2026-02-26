'use client';

import React, { useState } from 'react';
import { Shield, Clock, User, HardDrive, AlertCircle } from 'lucide-react';

interface AuditLog {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    action: string;
    entity_type: string;
    entity_id: number | null;
    details: string | null;
    created_at: string;
}

interface AuditLogViewerProps {
    initialLogs: AuditLog[];
}

export default function AuditLogViewer({ initialLogs }: AuditLogViewerProps) {
    const [logs] = useState<AuditLog[]>(initialLogs);

    const getActionColor = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('create') || a.includes('add')) return 'text-emerald-400';
        if (a.includes('delete') || a.includes('remove')) return 'text-rose-400';
        if (a.includes('update') || a.includes('edit')) return 'text-indigo-400';
        return 'text-amber-400';
    };

    return (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-[var(--border-subtle)] bg-black/20 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Security Audit Trail
                </h3>
                <div className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-widest">
                    Last 20 Events
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="p-12 text-center text-[var(--text-tertiary)] flex flex-col items-center gap-3">
                        <AlertCircle className="w-8 h-8 opacity-20" />
                        <p>No audit logs recorded yet.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-tertiary)] uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Event</th>
                                <th className="px-5 py-3 font-semibold">User</th>
                                <th className="px-5 py-3 font-semibold">Entity</th>
                                <th className="px-5 py-3 font-semibold text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-5 py-4">
                                        <div className={`font-medium ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </div>
                                        {log.details && (
                                            <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5 max-w-xs truncate">
                                                {log.details}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                <User size={12} className="text-[var(--text-tertiary)]" />
                                            </div>
                                            <div>
                                                <div className="text-[var(--text-secondary)] font-medium">{log.user_name || 'System'}</div>
                                                <div className="text-[9px] text-[var(--text-tertiary)]">{log.user_email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                                            <HardDrive size={12} />
                                            <span>{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right tabular-nums text-[var(--text-tertiary)]">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="text-[9px] mt-0.5">
                                                {new Date(log.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="p-3 bg-black/10 border-t border-[var(--border-subtle)] text-center">
                <button className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] hover:text-white transition-colors">
                    View Full Security History →
                </button>
            </div>
        </div>
    );
}
