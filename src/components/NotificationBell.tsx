'use client';

import { useState, useEffect } from 'react';
import { getUnreadNotifications, markNotificationAsRead } from '@/app/actions';
import { Bell } from 'lucide-react';
import Link from 'next/link';

interface Notification {
    id: number;
    type: string;
    message: string;
    link: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationBell({ userRole }: { userRole: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Only Admin and Team see notifications
    if (userRole !== 'Admin' && userRole !== 'Team') return null;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        const fetchNotifs = async () => {
            const data = await getUnreadNotifications();
            if (data) setNotifications(data);
        };
        fetchNotifs();
        // Polling every minute for new requests
        const interval = setInterval(fetchNotifs, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleRead = async (id: number) => {
        await markNotificationAsRead(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#121214] border border-[var(--border-subtle)] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-white/[0.02]">
                        <h3 className="font-bold text-sm">Notifications</h3>
                        <span className="text-xs text-[var(--text-tertiary)]">{notifications.length} unread</span>
                    </div>

                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-[var(--text-tertiary)] text-sm">
                                You're all caught up!
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--border-subtle)]">
                                {notifications.map(n => (
                                    <div key={n.id} className="p-4 hover:bg-white/5 transition-colors group relative">
                                        <div className="flex gap-3">
                                            <div className="w-2 h-2 mt-1.5 bg-indigo-500 rounded-full flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-200 mb-2">{n.message}</p>
                                                <div className="flex items-center gap-3">
                                                    {n.link && (
                                                        <Link href={n.link} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                                                            View Details
                                                        </Link>
                                                    )}
                                                    <button
                                                        onClick={() => handleRead(n.id)}
                                                        className="text-xs text-[var(--text-tertiary)] hover:text-white"
                                                    >
                                                        Mark as Read
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
