'use client';

import React from 'react';
import { Check, Video, Edit3, Eye, Package, Hexagon } from 'lucide-react';

interface ProductionTrackerProps {
    projectStatus: string;
    shoots: any[];
}

export default function ProductionTracker({ projectStatus, shoots }: ProductionTrackerProps) {
    // Define Stages
    const stages = [
        { id: 'strategy', label: 'Strategy', icon: Hexagon, color: 'emerald' },
        { id: 'shooting', label: 'Shooting', icon: Video, color: 'violet' },
        { id: 'editing', label: 'Editing', icon: Edit3, color: 'blue' },
        { id: 'review', label: 'Review', icon: Eye, color: 'amber' },
        { id: 'delivered', label: 'Delivered', icon: Package, color: 'emerald' },
    ];

    // Calculate current stage index (0-4)
    let currentStageIndex = 0;

    if (projectStatus === 'Completed') {
        currentStageIndex = 4;
    } else {
        // Checking shoots for status
        const hasShoots = shoots.length > 0;
        const shootStatuses = shoots.map(s => s.status?.toLowerCase() || 'planned');
        const postProdStatuses = shoots.map(s => s.post_prod_status?.toLowerCase() || '');

        if (postProdStatuses.includes('in review') || postProdStatuses.includes('validation')) {
            currentStageIndex = 3;
        } else if (postProdStatuses.includes('editing') || postProdStatuses.includes('derush')) {
            currentStageIndex = 2;
        } else if (hasShoots) {
            currentStageIndex = 1;
        } else {
            currentStageIndex = 0;
        }
    }

    return (
        <div className="w-full py-8">
            <div className="relative">
                {/* Connection Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[var(--border-subtle)] -translate-y-1/2 hidden md:block" />
                
                {/* Active Connection Line */}
                <div 
                    className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-emerald-500 via-violet-500 to-emerald-500 -translate-y-1/2 transition-all duration-1000 hidden md:block" 
                    style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
                />

                <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-0">
                    {stages.map((stage, index) => {
                        const Icon = stage.icon;
                        const isCompleted = index < currentStageIndex;
                        const isActive = index === currentStageIndex;
                        const isUpcoming = index > currentStageIndex;

                        return (
                            <div key={stage.id} className="flex md:flex-col items-center gap-4 md:gap-3 flex-1">
                                {/* Step Circle */}
                                <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 transform ${
                                    isActive 
                                        ? 'bg-[#0A0A0A] border-emerald-500 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                        : isCompleted 
                                            ? 'bg-emerald-500 border-emerald-500' 
                                            : 'bg-[#050505] border-[var(--border-subtle)]'
                                }`}>
                                    {isCompleted ? (
                                        <Check size={18} className="text-black font-bold" />
                                    ) : (
                                        <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-[var(--text-tertiary)]'} />
                                    )}
                                    
                                    {/* Pulse effect for active */}
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/20" />
                                    )}
                                </div>

                                {/* Label */}
                                <div className="flex flex-col md:items-center text-left md:text-center">
                                    <span className={`text-xs font-bold uppercase tracking-widest transition-colors duration-500 ${
                                        isActive ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-[var(--text-tertiary)]'
                                    }`}>
                                        {stage.label}
                                    </span>
                                    {isActive && (
                                        <span className="text-[10px] text-emerald-500/80 font-medium md:mt-0.5 animate-pulse lowercase">
                                            Current Step
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
