'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, Video, CreditCard, Settings, Command } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    // Open command menu hint
    const openCommandMenu = () => {
        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
        document.dispatchEvent(event);
    };

    const links = [
        { href: '/', label: 'Dashboard', icon: Home },
        { href: '/clients', label: 'Clients', icon: Users },
        { href: '/projects', label: 'Projects', icon: Briefcase },
        { href: '/shoots', label: 'Shoots', icon: Video },
        { href: '/finance', label: 'Finance', icon: CreditCard },
        { href: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] z-40 hidden md:flex flex-col">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <span className="font-bold text-white text-lg">D</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">Defcon</span>
                </div>

                <div className="space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group ${isActive
                                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-[var(--text-tertiary)] group-hover:text-white'}`} />
                                {link.label}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="mt-auto p-6 border-t border-[var(--border-subtle)]">
                <button
                    onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-md bg-[var(--bg-root)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:border-[var(--text-tertiary)] transition-colors text-left"
                >
                    <Command className="w-3 h-3" />
                    <span>Quick Search...</span>
                    <span className="ml-auto text-[10px] opacity-50">⌘K</span>
                </button>
            </div>
        </aside>
    );
}
