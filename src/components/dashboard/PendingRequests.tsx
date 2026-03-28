'use client';

import React, { useTransition } from 'react';
import { approveShoot, denyShoot } from '@/app/actions';
import { Check, X, Calendar, User, Phone, Mail, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PendingRequestsProps {
    shoots: any[];
}

export default function PendingRequests({ shoots }: PendingRequestsProps) {
    const [isPending, startTransition] = useTransition();

    const pendingRequests = shoots.filter(s => s.status === 'Pending');

    if (pendingRequests.length === 0) return null;

    const handleApprove = async (id: number) => {
        if (!confirm('Approuver cette demande de tournage ?')) return;
        startTransition(async () => {
            await approveShoot(id);
        });
    };

    const handleReject = async (id: number) => {
        if (!confirm('Supprimer cette demande ? Cette action est irréversible.')) return;
        startTransition(async () => {
            await denyShoot(id);
        });
    };

    return (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute w-4 h-4 rounded-full bg-amber-500 animate-ping opacity-25" />
                        <div className="relative w-2 h-2 rounded-full bg-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            Demandes de Réservation
                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full text-xs font-mono">
                                {pendingRequests.length}
                            </span>
                        </h2>
                        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-[0.1em] mt-0.5">Nouvelles entrées public</p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingRequests.map((request) => (
                    <div 
                        key={request.id} 
                        className="relative pro-card-tertiary p-6 border border-white/5 shadow-2xl shadow-black/40 overflow-hidden group hover:border-amber-500/50 transition-all duration-300"
                    >
                        {/* Background subtle gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-5">
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                            {request.shoot_type || 'Tournage'}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-bold text-lg leading-tight truncate group-hover:text-amber-400 transition-colors">
                                        {request.title || 'Requête sans titre'}
                                    </h3>
                                </div>
                                
                                <div className="flex gap-2 shrink-0">
                                    <button 
                                        onClick={() => handleApprove(request.id)}
                                        disabled={isPending}
                                        className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all transform active:scale-90 shadow-lg shadow-emerald-500/10"
                                        title="Approuver"
                                    >
                                        <Check className="w-4.5 h-4.5" />
                                    </button>
                                    <button 
                                        onClick={() => handleReject(request.id)}
                                        disabled={isPending}
                                        className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all transform active:scale-90 shadow-lg shadow-red-500/10"
                                        title="Supprimer"
                                    >
                                        <X className="w-4.5 h-4.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/20">
                                        <User className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-white text-sm truncate">{request.contact_name || 'Inconnu'}</div>
                                        <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider truncate">
                                            {request.client_company || 'Public Request'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center text-center">
                                        <Calendar className="w-4 h-4 text-violet-400 mb-1" />
                                        <span className="text-[11px] font-medium text-white">
                                            {request.shoot_date ? format(new Date(request.shoot_date), 'dd MMM yyyy', { locale: fr }) : '---'}
                                        </span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center text-center">
                                        <Clock className="w-4 h-4 text-violet-400 mb-1" />
                                        <span className="text-[11px] font-medium text-white">
                                            {request.start_time || '--:--'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 px-1">
                                    {request.contact_email && (
                                        <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] hover:text-white transition-colors group/link">
                                            <Mail className="w-3.5 h-3.5 text-violet-500 group-hover/link:text-violet-400" />
                                            <span className="truncate">{request.contact_email}</span>
                                        </div>
                                    )}
                                    {request.contact_phone && (
                                        <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] hover:text-white transition-colors group/link">
                                            <Phone className="w-3.5 h-3.5 text-emerald-500 group-hover/link:text-emerald-400" />
                                            {request.contact_phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
