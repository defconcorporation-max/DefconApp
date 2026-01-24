'use client';

import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getGlobalSearchData, SearchResult } from '@/app/actions';
import { Search, File, Users, Briefcase, Video, ArrowRight } from 'lucide-react';

export default function CommandMenu() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [pages, setPages] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Fetch data when opening
    useEffect(() => {
        if (open && pages.length === 0) {
            setLoading(true);
            getGlobalSearchData().then((data) => {
                setPages(data);
                setLoading(false);
            });
        }
    }, [open, pages.length]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    // Filter results locally for instant feedback
    // (cmdk does fuzzy search automatically if we just render items)
    // But we can also pre-filter or group them.

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Command
                className="w-full max-w-2xl bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                loop
            >
                <div className="flex items-center border-b border-[var(--border-subtle)] px-3" cmdk-input-wrapper="">
                    <Search className="w-5 h-5 text-[var(--text-tertiary)] mr-2" />
                    <Command.Input
                        value={search}
                        onValueChange={setSearch}
                        placeholder="Search clients, projects, or shoots..."
                        className="flex-1 h-12 bg-transparent text-white text-sm outline-none placeholder:text-[var(--text-tertiary)]"
                    />
                    <kbd className="hidden sm:inline-block pointer-events-none select-none items-center gap-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-1.5 font-mono text-[10px] font-medium text-[var(--text-secondary)] opacity-100">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </div>

                <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2">
                    {loading && (
                        <div className="p-4 text-center text-sm text-[var(--text-tertiary)]">Loading index...</div>
                    )}

                    {!loading && pages.length === 0 && (
                        <Command.Empty className="p-4 text-center text-sm text-[var(--text-tertiary)]">
                            No results found.
                        </Command.Empty>
                    )}

                    {!loading && (
                        <>
                            <Command.Group heading="Pages" className="text-xs font-medium text-[var(--text-tertiary)] px-2 py-1.5 mb-1">
                                {pages.filter(i => i.type === 'Page').map(item => (
                                    <Item key={item.id} item={item} onSelect={() => runCommand(() => router.push(item.url))} />
                                ))}
                            </Command.Group>

                            <Command.Group heading="Clients" className="text-xs font-medium text-[var(--text-tertiary)] px-2 py-1.5 mb-1 mt-2">
                                {pages.filter(i => i.type === 'Client').map(item => (
                                    <Item key={item.id} item={item} onSelect={() => runCommand(() => router.push(item.url))} />
                                ))}
                            </Command.Group>

                            <Command.Group heading="Projects" className="text-xs font-medium text-[var(--text-tertiary)] px-2 py-1.5 mb-1 mt-2">
                                {pages.filter(i => i.type === 'Project').map(item => (
                                    <Item key={item.id} item={item} onSelect={() => runCommand(() => router.push(item.url))} />
                                ))}
                            </Command.Group>

                            <Command.Group heading="Shoots" className="text-xs font-medium text-[var(--text-tertiary)] px-2 py-1.5 mb-1 mt-2">
                                {pages.filter(i => i.type === 'Shoot').map(item => (
                                    <Item key={item.id} item={item} onSelect={() => runCommand(() => router.push(item.url))} />
                                ))}
                            </Command.Group>
                        </>
                    )}
                </Command.List>
            </Command>
        </div>
    );
}

function Item({ item, onSelect }: { item: SearchResult, onSelect: () => void }) {
    let Icon = File;
    if (item.type === 'Client') Icon = Users;
    if (item.type === 'Project') Icon = Briefcase;
    if (item.type === 'Shoot') Icon = Video;

    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-white cursor-pointer group aria-selected:bg-[var(--bg-surface-hover)] aria-selected:text-white transition-colors"
        >
            <div className="flex items-center justify-center w-6 h-6 rounded bg-[var(--bg-active)]/50 group-aria-selected:bg-[var(--bg-active)] text-white/70 group-aria-selected:text-white transition-colors">
                <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 flex flex-col">
                <span className="font-medium text-white">{item.label}</span>
                {item.subLabel && <span className="text-xs text-[var(--text-tertiary)] group-aria-selected:text-[var(--text-secondary)]">{item.subLabel}</span>}
            </div>
            <ArrowRight className="w-4 h-4 opacity-0 group-aria-selected:opacity-100 text-[var(--text-tertiary)] transition-opacity" />
        </Command.Item>
    );
}
