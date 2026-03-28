'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    Home, 
    Users, 
    Briefcase, 
    Video, 
    CreditCard, 
    Settings, 
    Command, 
    Layers, 
    UserPlus, 
    BookOpen, 
    Building, 
    Calendar, 
    Shield, 
    Activity, 
    LogOut, 
    Sparkles, 
    Target, 
    ListTodo, 
    Plus, 
    Search, 
    Zap, 
    X 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';
import BetaFeedbackWidget from './BetaFeedbackWidget';

export default function Sidebar({ userRole = '' }: { userRole?: string }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [quickActionOpen, setQuickActionOpen] = useState(false);

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
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 group ${isActive
            ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
            : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white border border-transparent'
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
            {/* Mobile Header - Ultra Subtle Fixed Top */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#09090b]/40 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between z-[55] transition-all">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 group cursor-pointer hover:scale-105 transition-transform">
                        <span className="font-black text-white text-xl">D</span>
                    </div>
                    <span className="font-black text-xl tracking-tighter text-white uppercase italic">Defcon</span>
                </div>
                <div className="flex items-center gap-4">
                    <NotificationBell userRole={userRole} />
                    <button
                        onClick={() => setOpen(!open)}
                        className={`p-2 rounded-xl transition-all ${open ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'text-white hover:bg-white/10'}`}
                    >
                        {open ? <X size={24} /> : <Layers size={21} />}
                    </button>
                </div>
            </header>

            {/* Mobile Drawer - Framer Motion Edition */}
            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-[70] md:hidden">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md" 
                            onClick={() => setOpen(false)} 
                        />
                        <motion.aside 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-80 bg-[#09090b]/80 backdrop-blur-3xl border-l border-white/5 p-8 overflow-y-auto shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <span className="font-black text-xl tracking-tighter text-white uppercase italic">Menu</span>
                                <button onClick={() => setOpen(false)} className="p-2 rounded-xl bg-white/5 text-[var(--text-tertiary)] hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
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
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>

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

            {/* Mobile Bottom Navigation Bar - Floating Dock Edition */}
            <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md">
                <nav className="relative h-16 bg-[#18181b]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] px-6 flex items-center justify-between shadow-2xl shadow-black/80">
                    <Link 
                        href="/" 
                        className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${pathname === '/' ? 'text-white' : 'text-[var(--text-tertiary)]'}`}
                    >
                        <Home size={22} className={pathname === '/' ? 'stroke-[2.5px]' : ''} />
                        {pathname === '/' && (
                            <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 rounded-full bg-indigo-400" />
                        )}
                    </Link>
                    
                    <Link 
                        href="/shoots" 
                        className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${pathname?.startsWith('/shoots') ? 'text-white' : 'text-[var(--text-tertiary)]'}`}
                    >
                        <Video size={22} className={pathname?.startsWith('/shoots') ? 'stroke-[2.5px]' : ''} />
                        {pathname?.startsWith('/shoots') && (
                            <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 rounded-full bg-indigo-400" />
                        )}
                    </Link>

                    {/* Quick Action Center Button */}
                    <div className="relative -top-3">
                        <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setQuickActionOpen(!quickActionOpen)}
                            className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/40 border-4 border-[#18181b]"
                        >
                            <motion.div
                                animate={{ rotate: quickActionOpen ? 45 : 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            >
                                <Plus size={28} />
                            </motion.div>
                        </motion.button>
                        
                        {/* Quick Action Menu */}
                        <AnimatePresence>
                            {quickActionOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                                    className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 bg-[#18181b] border border-white/10 rounded-2xl p-2 shadow-2xl grid grid-cols-1 gap-1"
                                >
                                    {[
                                        { label: 'Nouveau Shoot', icon: Video, color: 'text-violet-400', href: '/shoots' },
                                        { label: 'Nouveau Projet', icon: Briefcase, color: 'text-indigo-400', href: '/projects' },
                                        { label: 'Nouveau Lead', icon: Target, color: 'text-emerald-400', href: '/leads' },
                                    ].map((action) => (
                                        <Link 
                                            key={action.label}
                                            href={action.href}
                                            onClick={() => setQuickActionOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                                        >
                                            <action.icon size={16} className={action.color} />
                                            <span className="text-xs font-bold text-white uppercase tracking-wider">{action.label}</span>
                                        </Link>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <Link 
                        href="/projects" 
                        className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${pathname?.startsWith('/projects') ? 'text-white' : 'text-[var(--text-tertiary)]'}`}
                    >
                        <Briefcase size={22} className={pathname?.startsWith('/projects') ? 'stroke-[2.5px]' : ''} />
                        {pathname?.startsWith('/projects') && (
                            <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 rounded-full bg-indigo-400" />
                        )}
                    </Link>

                    <button 
                        onClick={() => setOpen(true)}
                        className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${open ? 'text-white' : 'text-[var(--text-tertiary)]'}`}
                    >
                        <Layers size={22} className={open ? 'stroke-[2.5px]' : ''} />
                        {open && (
                            <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 rounded-full bg-indigo-400" />
                        )}
                    </button>
                </nav>
            </div>
        </>
    );
}
