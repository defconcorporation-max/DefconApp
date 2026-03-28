'use client';

import { Calendar, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { dateKeyFromStored, parseDateOnlyLocal, todayDateKeyLocal } from '@/lib/date-local';

interface ThisWeekSummaryProps {
    shoots: any[];
    tasks: any[];
    projects?: any[];
}

export default function ThisWeekSummary({ shoots, tasks, projects }: ThisWeekSummaryProps) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    const today = todayDateKeyLocal();

    // This week's shoots
    const weekShoots = shoots.filter(s => {
        const d = parseDateOnlyLocal(s.shoot_date);
        return d >= startOfWeek && d <= endOfWeek;
    });

    const todayShoots = shoots.filter(s => dateKeyFromStored(s.shoot_date) === today);

    // Overdue tasks (past due_date, not completed)
    const overdueTasks = tasks.filter(t => {
        const isDone = t.status === 'Done' || t.is_completed;
        return !isDone && t.due_date && t.due_date < today;
    });

    // Tasks due this week
    const weekTasks = tasks.filter(t => {
        const isDone = t.status === 'Done' || t.is_completed;
        if (isDone || !t.due_date) return false;
        const d = new Date(t.due_date);
        return d >= startOfWeek && d <= endOfWeek;
    });

    // Overdue projects
    const overdueProjects = (projects || []).filter((p: any) =>
        p.due_date && p.due_date < today && p.status !== 'Completed' && p.status !== 'Archived'
    );

    const items = [
        {
            icon: <Calendar size={18} className="text-violet-400" />,
            label: "Shoots aujourd'hui",
            value: todayShoots.length,
            sublabel: todayShoots.length > 0
                ? todayShoots.map((s: any) => s.title || s.client_name).join(', ')
                : 'Aucun shoot',
            color: todayShoots.length > 0 ? 'text-violet-400' : 'text-[var(--text-tertiary)]',
        },
        {
            icon: <Clock size={18} className="text-blue-400" />,
            label: 'Shoots cette semaine',
            value: weekShoots.length,
            sublabel: weekShoots.length > 0
                ? `${weekShoots.filter(s => s.status === 'Completed').length} terminé(s)`
                : 'Semaine libre',
            color: 'text-blue-400',
        },
        {
            icon: <CheckCircle2 size={18} className="text-amber-400" />,
            label: 'Tâches cette semaine',
            value: weekTasks.length,
            sublabel: weekTasks.length > 0
                ? `${weekTasks.filter(t => t.status === 'Done' || t.is_completed).length}/${weekTasks.length} complétées`
                : 'Tout est à jour',
            color: 'text-amber-400',
        },
        {
            icon: <AlertTriangle size={18} className="text-red-400" />,
            label: 'En retard',
            value: overdueTasks.length + overdueProjects.length,
            sublabel: overdueTasks.length > 0
                ? `${overdueTasks.length} tâche(s), ${overdueProjects.length} projet(s)`
                : 'Rien en retard 🎉',
            color: (overdueTasks.length + overdueProjects.length) > 0 ? 'text-red-400' : 'text-emerald-400',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((item) => (
                <div
                    key={item.label}
                    className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-violet-500/30 transition-all group"
                >
                    <div className="flex items-center gap-2 mb-2">
                        {item.icon}
                        <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium">
                            {item.label}
                        </span>
                    </div>
                    <div className={`text-3xl font-bold tabular-nums ${item.color}`}>
                        {item.value}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-1 truncate">
                        {item.sublabel}
                    </div>
                </div>
            ))}
        </div>
    );
}
