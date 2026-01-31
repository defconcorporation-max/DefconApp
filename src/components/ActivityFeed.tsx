'use client';

import { Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type ActivityItem = {
    id: number;
    type: string;
    description: string;
    entity_id: number;
    entity_type: string;
    created_at: string;
};

const ActivityIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'SHOOT_CREATED': return <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />;
        case 'SHOOT_COMPLETED': return <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />;
        case 'PAYMENT_RECEIVED': return <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />;
        case 'PROJECT_CREATED': return <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />;
        case 'PROJECT_STATUS': return <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />;
        case 'CLIENT_CREATED': return <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />;
        default: return <span className="w-2 h-2 rounded-full bg-gray-500" />;
    }
};

export default function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
    if (!activities || activities.length === 0) {
        return (
            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 h-full min-h-[300px] flex flex-col items-center justify-center text-[var(--text-tertiary)]">
                <Activity size={24} className="mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 rounded-xl h-full flex flex-col">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                <Activity size={18} className="text-indigo-400" />
                Latest Activity
            </h2>
            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                {activities.map((item) => (
                    <div key={item.id} className="relative pl-6 pb-2 border-l border-white/5 last:border-l-0">
                        <div className="absolute left-[-5px] top-[6px]">
                            <ActivityIcon type={item.type} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-gray-300 font-medium">
                                {item.description}
                            </p>
                            <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
