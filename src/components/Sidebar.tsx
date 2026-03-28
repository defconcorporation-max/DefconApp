'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, Video, CreditCard, Settings, Command, Layers, UserPlus, BookOpen, Building, Calendar, Shield, Activity, LogOut, Sparkles, Target, ListTodo } from 'lucide-react';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import NotificationBell from './NotificationBell';
import BetaFeedbackWidget from './BetaFeedbackWidget';

export default function Sidebar({ userRole = '' }: { userRole?: string }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    // Open command menu hint
    const openCommandMenu = () => {
        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
        document.dispatchEvent(event);
    };

    const isAdmin = userRole === 'Admin' || userRole === 'Team';
    const canAccessFinance = userRole === 'Admin';

    const sectionDaily = [
        { href: '/', label: 'Dashboard', icon: Home },
        { href: '/tasks', label: 'Tasks', icon: ListTodo },
        { href: '/shoots', label: 'Shoots', icon: Video },
        { href: '/availability', label: 'Availability', icon: Calendar },
        { href: '/post-production', label: 'Post-Production', icon: Layers },
    ];
    const sectionClients = [
        { href: '/leads', label: 'Leads', icon: Target },
        { href: '/clients', label: 'Clients', icon: Users },
        { href: '/projects', label: 'Projects', icon: Briefcase },
        ...(canAccessFinance ? [{ href: '/finance', label: 'Finance', icon: CreditCard }] as const : []),
    ];
    const sectionCreative = [
        { href: '/creative-studio', label: 'Creative Studio', icon: Sparkles },
        { href: '/actors', label: 'Actors', icon: UserPlus },
    ];
    const sectionAdmin = [
        { href: '/analytics', label: 'Analytics', icon: Activity },
        { href: '/agencies', label: 'Agencies', icon: Building },
        { href: '/team', label: 'Team', icon: UserPlus },
        { href: '/users', label: 'Users', icon: Shield },
        { href: '/services', label: 'Services', icon: BookOpen },
        { href: '/settings', label: 'Settings', icon: Settings },
    ];

    const linkClass = (isActive: boolean) =>
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group ${isActive
            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-white'
        }`;
    const sectionLabel = 'px-3 pb-2 pt-4 first:pt-0 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider';

    const renderLinks = (links: typeof sectionDaily, pathname: string) =>
        links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname ? (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))) : false;
            return (
                <Link key={link.href} href={link.href} className={linkClass(isActive)}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-[var(--text-tertiary)] group-hover:text-white'}`} />
                    {link.label}
                </Link>
            );
        });

    return (
        <>
            {/* Mobile Header - Fixed Top */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--bg-root)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 flex items-center justify-between z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <span className="font-bold text-white text-lg">D</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">Defcon</span>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationBell userRole={userRole} />
                    <button
                        onClick={() => setOpen(!open)}
                        className="p-2 text-white hover:bg-white/10 rounded-md transition-colors"
                    >
                        {open ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Mobile Drawer */}
            {open && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <aside className="fixed right-0 top-16 bottom-0 w-64 bg-[var(--bg-surface)]/70 backdrop-blur-xl border-l border-[var(--border-subtle)] p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
                        <div className="space-y-1">
                            <div className={sectionLabel}>Au quotidien</div>
                            {sectionDaily.map((link) => (
                                <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={linkClass(!!pathname && (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))))}>
                                    <link.icon className={`w-4 h-4 ${pathname && (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))) ? 'text-indigo-400' : 'text-[var(--text-tertiary)] group-hover:text-white'}`} />
                                    {link.label}
                                </Link>
                            ))}
                            <div className={sectionLabel}>Clients & projets</div>
                            {sectionClients.map((link) => (
                                <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={linkClass(!!pathname && (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))))}>
                                    <link.icon className={`w-4 h-4 ${pathname && (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))) ? 'text-indigo-400' : 'text-[var(--text-tertiary)] group-hover:text-white'}`} />
                                    {link.label}
                                </Link>
                            ))}
                            <div className={sectionLabel}>Créatif</div>
                            {sectionCreative.map((link) => (
                                <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={linkClass(!!pathname && (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))))}>
                                    <link.icon className={`w-4 h-4 ${pathname && (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))) ? 'text-indigo-400' : 'text-[var(--text-tertiary)] group-hover:text-white'}`} />
                                    {link.label}
                                </Link>
                            ))}
                            {isAdmin && (
                                <>
                                    <div className={sectionLabel}>Workspace</div>
                                    {sectionAdmin.map((link) => (
                                        <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={linkClass(!!pathname && (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))))}>
                                            <link.icon className={`w-4 h-4 ${pathname && (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))) ? 'text-indigo-400' : 'text-[var(--text-tertiary)] group-hover:text-white'}`} />
                                            {link.label}
                                        </Link>
                                    ))}
                                </>
                            )}
                            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                                <BetaFeedbackWidget />
                            </div>
                            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                                <button
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium transition-all duration-200 text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#09090b]/40 backdrop-blur-2xl border-r border-white/5 z-40 hidden md:flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <span className="font-bold text-white text-lg">D</span>
                            </div>
                            <span className="font-bold text-lg tracking-tight text-white">Defcon</span>
                        </div>
                        <NotificationBell userRole={userRole} />
                    </div>

                    <div className="space-y-1">
                        <div className={sectionLabel}>Au quotidien</div>
                        {renderLinks(sectionDaily, pathname || '')}
                        <div className={sectionLabel}>Clients & projets</div>
                        {renderLinks(sectionClients, pathname || '')}
                        <div className={sectionLabel}>Créatif</div>
                        {renderLinks(sectionCreative, pathname || '')}
                        {isAdmin && (
                            <>
                                <div className={sectionLabel}>Workspace</div>
                                {renderLinks(sectionAdmin, pathname || '')}
                            </>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Beta Testing</h4>
                            <Link href="/beta-feedback" className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors">
                                View Tickets
                            </Link>
                        </div>
                        <BetaFeedbackWidget />
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
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex items-center gap-2 w-full px-3 py-2 mt-2 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-colors text-left"
                    >
                        <LogOut className="w-3 h-3" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#09090b]/80 backdrop-blur-xl border-t border-white/5 px-6 flex items-center justify-between z-50 pb-safe">
                <Link 
                    href="/" 
                    className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-indigo-400' : 'text-[var(--text-tertiary)]'}`}
                >
                    <Home size={20} className={pathname === '/' ? 'animate-pulse' : ''} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
                </Link>
                <Link 
                    href="/shoots" 
                    className={`flex flex-col items-center gap-1 ${pathname?.startsWith('/shoots') ? 'text-indigo-400' : 'text-[var(--text-tertiary)]'}`}
                >
                    <Video size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Shoots</span>
                </Link>
                <Link 
                    href="/projects" 
                    className={`flex flex-col items-center gap-1 ${pathname?.startsWith('/projects') ? 'text-indigo-400' : 'text-[var(--text-tertiary)]'}`}
                >
                    <Briefcase size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Projects</span>
                </Link>
                {canAccessFinance && (
                    <Link 
                        href="/finance" 
                        className={`flex flex-col items-center gap-1 ${pathname?.startsWith('/finance') ? 'text-indigo-400' : 'text-[var(--text-tertiary)]'}`}
                    >
                        <CreditCard size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Finance</span>
                    </Link>
                )}
                <button 
                    onClick={() => setOpen(true)}
                    className="flex flex-col items-center gap-1 text-[var(--text-tertiary)]"
                >
                    <div className="w-5 h-5 flex flex-col justify-center gap-1">
                        <div className="w-full h-0.5 bg-current rounded-full" />
                        <div className="w-full h-0.5 bg-current rounded-full" />
                        <div className="w-full h-0.5 bg-current rounded-full" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Menu</span>
                </button>
            </nav>
        </>
    );
}
