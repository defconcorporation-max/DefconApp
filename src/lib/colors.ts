/**
 * Shared color utilities for pipeline stage badge rendering.
 * Used across Clients list, Client Kanban, Agency pages, etc.
 */

export type StageColor = {
    color: string;
    label: string;
};

const COLOR_MAP: Record<string, { badge: string; dot: string }> = {
    'bg-emerald-500': { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
    'bg-orange-500': { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-500' },
    'bg-blue-500': { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-500' },
    'bg-violet-500': { badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20', dot: 'bg-violet-500' },
    'bg-yellow-500': { badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-500' },
    'bg-red-500': { badge: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-500' },
    'bg-cyan-500': { badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', dot: 'bg-cyan-500' },
    'bg-rose-500': { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-500' },
    'bg-fuchsia-500': { badge: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20', dot: 'bg-fuchsia-500' },
    'bg-amber-500': { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
    'bg-slate-500': { badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-500' },
    'bg-gray-500': { badge: 'bg-gray-500/10 text-gray-400 border-gray-500/20', dot: 'bg-gray-500' },
};

const DEFAULT_COLORS = { badge: 'bg-gray-500/10 text-gray-400 border-gray-500/20', dot: 'bg-gray-500' };

/**
 * Find matching pipeline stage for a given client status string.
 */
function findStage(stages: { label: string; color: string }[], status: string) {
    return stages.find(s => s.label.toLowerCase() === (status || 'Active').toLowerCase());
}

/**
 * Returns Tailwind badge classes (bg + text + border) for a client status.
 * Used on pill/tag badges in cards.
 */
export function getBadgeClasses(stages: { label: string; color: string }[], status: string): string {
    const stage = findStage(stages, status);
    const bg = stage?.color || 'bg-gray-500';
    return (COLOR_MAP[bg] || DEFAULT_COLORS).badge;
}

/**
 * Returns a single Tailwind bg-color class for a small dot indicator.
 */
export function getDotColor(stages: { label: string; color: string }[], status: string): string {
    const stage = findStage(stages, status);
    const bg = stage?.color || 'bg-gray-500';
    return (COLOR_MAP[bg] || DEFAULT_COLORS).dot;
}
