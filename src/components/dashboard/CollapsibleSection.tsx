'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEY = 'defcon-dashboard-sections';

type SectionId = 'calendar' | 'kanban' | 'tasks' | 'activity';

const DEFAULT_OPEN: Record<SectionId, boolean> = {
  calendar: true,
  kanban: true,
  tasks: true,
  activity: false,
};

function getStoredState(): Record<SectionId, boolean> {
  if (typeof window === 'undefined') return DEFAULT_OPEN;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_OPEN;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return { ...DEFAULT_OPEN, ...parsed };
  } catch {
    return DEFAULT_OPEN;
  }
}

function setStoredState(state: Record<SectionId, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

type Props = {
  id: SectionId;
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
};

export default function CollapsibleSection({ id, title, viewAllHref, viewAllLabel, children }: Props) {
  const [open, setOpen] = useState(() => getStoredState()[id]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    const state = getStoredState();
    state[id] = next;
    setStoredState(state);
  };

  return (
    <section className="pro-card-hero">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-4 py-2 -my-2 px-1 rounded-lg hover:bg-white/5 transition-colors text-left"
      >
        <span className="section-label flex items-center gap-2 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-xs">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {title}
        </span>
        {viewAllHref && viewAllLabel && (
          <Link
            href={viewAllHref}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            {viewAllLabel}
          </Link>
        )}
      </button>
      {open && <div className="pt-4">{children}</div>}
    </section>
  );
}
