'use client';
import { useState, useRef, useCallback } from 'react';
import { ShootWithClient } from '@/types';
import { addShoot, updateShoot, deleteShoot, getProjects } from '@/app/actions';
import { dateKeyFromStored, formatDateKeyLocal, todayDateKeyLocal } from '@/lib/date-local';

interface CalendarProps {
    shoots: ShootWithClient[];
    clients?: { id: number, name: string, company_name: string }[];
}

// Available colors for the picker
const COLORS = [
    { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-100', dot: 'bg-indigo-500' },
    { name: 'Emerald', value: 'emerald', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-100', dot: 'bg-emerald-500' },
    { name: 'Rose', value: 'rose', bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-100', dot: 'bg-rose-500' },
    { name: 'Amber', value: 'amber', bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-100', dot: 'bg-amber-500' },
    { name: 'Sky', value: 'sky', bg: 'bg-sky-500/20', border: 'border-sky-500/50', text: 'text-sky-100', dot: 'bg-sky-500' },
    { name: 'Violet', value: 'violet', bg: 'bg-violet-500/20', border: 'border-violet-500/50', text: 'text-violet-100', dot: 'bg-violet-500' },
    { name: 'Fuchsia', value: 'fuchsia', bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/50', text: 'text-fuchsia-100', dot: 'bg-fuchsia-500' },
    { name: 'Slate', value: 'slate', bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-100', dot: 'bg-slate-500' },
];

export default function DashboardCalendar({ shoots, clients = [] }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
    const [isCollapsed, setIsCollapsed] = useState(false); // Ouvert par défaut pour voir l'horaire

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShoot, setEditingShoot] = useState<ShootWithClient | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [availableProjects, setAvailableProjects] = useState<any[]>([]); // New State
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('indigo'); // Default color

    // Drag & Drop State
    const [dragShootId, setDragShootId] = useState<number | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null); // "YYYY-MM-DD|HH:MM"

    const handleDragStart = useCallback((e: React.DragEvent, shoot: ShootWithClient) => {
        e.stopPropagation();
        setDragShootId(shoot.id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(shoot.id));
        // Make the drag image semi-transparent
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    }, []);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        setDragShootId(null);
        setDropTarget(null);
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, dateStr: string, time?: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget(time ? `${dateStr}|${time}` : dateStr);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDropTarget(null);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent, dateStr: string, hour?: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDropTarget(null);
        const shootId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!shootId || isNaN(shootId)) return;
        setDragShootId(null);

        const shoot = shoots.find(s => s.id === shootId);
        if (!shoot) return;

        const formData = new FormData();
        formData.append('id', String(shootId));
        formData.append('clientId', String(shoot.client_id));
        formData.append('title', shoot.title || 'Shoot');
        formData.append('date', dateStr);
        formData.append('color', shoot.color || 'indigo');
        if (shoot.project_id) formData.append('projectId', String(shoot.project_id));
        formData.append('dueDate', shoot.due_date || '');

        if (hour !== undefined) {
            const startTime = `${hour.toString().padStart(2, '0')}:00`;
            formData.append('startTime', startTime);
            // Keep same duration if shoot had end_time
            if (shoot.start_time && shoot.end_time) {
                const [sh, sm] = shoot.start_time.split(':').map(Number);
                const [eh, em] = shoot.end_time.split(':').map(Number);
                const durationM = (eh * 60 + em) - (sh * 60 + sm);
                const newEndM = hour * 60 + durationM;
                const endH = Math.floor(newEndM / 60);
                const endMin = newEndM % 60;
                formData.append('endTime', `${endH.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`);
            } else {
                formData.append('endTime', shoot.end_time || '');
            }
        } else {
            formData.append('startTime', shoot.start_time || '');
            formData.append('endTime', shoot.end_time || '');
        }

        await updateShoot(formData);
    }, [shoots]);

    // Calendar logic
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Configuration - Compact View
    const START_HOUR = 7;
    const END_HOUR = 22;
    const HOUR_HEIGHT = 48; // Compact height

    const timeSlots = Array.from({ length: (END_HOUR - START_HOUR + 1) * 2 }, (_, i) => {
        const hour = Math.floor(i / 2) + START_HOUR;
        const minute = i % 2 === 0 ? '00' : '30';
        return `${hour.toString().padStart(2, '0')}:${minute}`;
    });

    // Helpers
    const getWeekDays = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        const monday = new Date(d.setDate(diff));
        const week = [];
        for (let i = 0; i < 7; i++) {
            week.push(new Date(monday.getTime() + (i * 24 * 60 * 60 * 1000)));
        }
        return week;
    };

    const days = [];
    if (viewMode === 'month') {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const daysInMonth = lastDay.getDate();
        for (let i = 0; i < startDayOfWeek; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    } else if (viewMode === 'week') {
        days.push(...getWeekDays(currentDate));
    } else {
        days.push(currentDate);
    }

    const next = () => {
        if (viewMode === 'month') setCurrentDate(new Date(year, month + 1, 1));
        else if (viewMode === 'week') setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
        else setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    };

    const prev = () => {
        if (viewMode === 'month') setCurrentDate(new Date(year, month - 1, 1));
        else if (viewMode === 'week') setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
        else setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    };

    const today = () => setCurrentDate(new Date());

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // --- PROPORTIONAL SIZING LOGIC ---
    const calculateEventStyle = (start: string, end: string | undefined) => {
        if (!start) return {};
        const [startH, startM] = start.split(':').map(Number);

        let endH = startH + 1; // Default 1 hour
        let endM = startM;

        if (end) {
            [endH, endM] = end.split(':').map(Number);
        }

        const startMinutes = (startH * 60) + startM;
        const endMinutes = (endH * 60) + endM;
        const durationMinutes = endMinutes - startMinutes;

        // Offset from grid start (e.g., 7 AM)
        const offsetMinutes = startMinutes - (START_HOUR * 60);

        return {
            top: `${(offsetMinutes / 60) * HOUR_HEIGHT}px`,
            height: `${(durationMinutes / 60) * HOUR_HEIGHT}px`,
            position: 'absolute' as 'absolute',
        };
    };

    const getTheme = (colorName: string | undefined) => {
        return COLORS.find(c => c.value === colorName) || COLORS[0];
    };

    // Interaction Handlers
    const handleDateClick = (date: Date) => {
        setEditingShoot(null);
        setSelectedColor('indigo');
        const dateString = formatDateKeyLocal(date);
        setSelectedDate(dateString);
        setSelectedTime('09:00');
        setIsModalOpen(true);
    };

    const handleTimeSlotClick = (date: Date, hour: number, minute: number = 0) => {
        setEditingShoot(null);
        setSelectedColor('indigo');
        const dateString = formatDateKeyLocal(date);
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        setSelectedDate(dateString);
        setSelectedTime(timeString);
        setIsModalOpen(true);
    };

    const handleEventClick = (e: React.MouseEvent, shoot: ShootWithClient) => {
        e.stopPropagation();
        // Navigate to the shoot details page
        window.location.href = `/shoots/${shoot.id}`;
    };

    const handleFormSubmit = async (formData: FormData) => {
        await addShoot(formData); // We only use modal for adding now
        setIsModalOpen(false);
    };

    const handleDelete = async () => {
        if (!editingShoot) return;
        if (confirm('Are you sure you want to delete this shoot?')) {
            const formData = new FormData();
            formData.append('id', editingShoot.id.toString());
            await deleteShoot(formData);
            setIsModalOpen(false);
        }
    };

    return (
        <section className={`mb-12 transition-all duration-300 relative ${isCollapsed ? 'mb-8' : ''}`}>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-lg w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
                            <h3 className="text-white font-medium">{editingShoot ? 'Edit Shoot' : 'Schedule Shoot'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-tertiary)] hover:text-white">✕</button>
                        </div>
                        <form action={handleFormSubmit} className="p-4 space-y-4">
                            {editingShoot && <input type="hidden" name="id" value={editingShoot.id} />}
                            <div className="space-y-1">
                                <label className="text-xs text-[var(--text-secondary)]">Client</label>
                                <select
                                    name="clientId"
                                    defaultValue={editingShoot?.client_id}
                                    onChange={(e) => {
                                        // Fetch projects for this client
                                        const val = e.target.value;
                                        if (!val) {
                                            setAvailableProjects([]);
                                            return;
                                        }
                                        const cid = Number(val);
                                        getProjects(cid).then(projs => setAvailableProjects(projs)).catch(() => setAvailableProjects([]));
                                    }}
                                    className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] text-white text-sm rounded px-2 py-2 focus:border-[var(--text-secondary)] outline-none"
                                    required
                                >
                                    <option value="" className="bg-[#111] text-white">-- Select Client --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id} className="bg-[#111] text-white">{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Project Select - New */}
                            <div className="space-y-1">
                                <label className="text-xs text-[var(--text-secondary)]">Project (Optional)</label>
                                <select
                                    name="projectId"
                                    defaultValue={editingShoot?.project_id || ''}
                                    className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] text-white text-sm rounded px-2 py-2 focus:border-[var(--text-secondary)] outline-none"
                                >
                                    <option value="" className="bg-[#111] text-white">-- No Project --</option>
                                    {availableProjects.map(p => (
                                        <option key={p.id} value={p.id} className="bg-[#111] text-white">{p.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-[var(--text-secondary)]">Shoot Title</label>
                                <input name="title" type="text" defaultValue={editingShoot?.title} placeholder="e.g. Brand Video Shoot" className="pro-input w-full" required />
                            </div>

                            {/* Color Picker */}
                            <div className="space-y-2">
                                <label className="text-xs text-[var(--text-secondary)]">Event Color</label>
                                <div className="flex gap-3">
                                    {COLORS.map(c => (
                                        <label key={c.value} className="cursor-pointer relative">
                                            <input
                                                type="radio"
                                                name="color"
                                                value={c.value}
                                                checked={selectedColor === c.value}
                                                onChange={() => setSelectedColor(c.value)}
                                                className="sr-only"
                                            />
                                            <div className={`w-6 h-6 rounded-full ${c.dot} ${selectedColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'}`}></div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-[var(--text-secondary)]">Date</label>
                                    <input name="date" type="date" defaultValue={selectedDate} className="pro-input w-full" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-[var(--text-secondary)]">Start Time</label>
                                    <select
                                        name="startTime"
                                        defaultValue={editingShoot?.start_time || selectedTime}
                                        className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] text-white text-sm rounded px-2 py-2 focus:border-[var(--text-secondary)] outline-none"
                                    >
                                        {timeSlots.map(time => (
                                            <option key={time} value={time} className="bg-[#111] text-white">{time}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[var(--text-secondary)]">End Time (Optional)</label>
                                <select
                                    name="endTime"
                                    defaultValue={editingShoot?.end_time || ''}
                                    className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] text-white text-sm rounded px-2 py-2 focus:border-[var(--text-secondary)] outline-none"
                                >
                                    <option value="" className="bg-[#111] text-white">-- No End Time --</option>
                                    {timeSlots.map(time => (
                                        <option key={time} value={time} className="bg-[#111] text-white">{time}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-2 flex justify-between items-center gap-2">
                                {editingShoot ? (
                                    <button type="button" onClick={handleDelete} className="px-3 py-1.5 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">Delete</button>
                                ) : (
                                    <div></div>
                                )}
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-white">Cancel</button>
                                    <button type="submit" className="pro-button text-sm px-4 py-1.5 bg-white text-black hover:bg-gray-200">
                                        {editingShoot ? 'Save Changes' : 'Schedule'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-white transition-colors"
                    >
                        {isCollapsed ? '↓' : '↑'}
                    </button>
                    {!isCollapsed && (
                        <>
                            <h2 className="text-lg font-medium tracking-tight text-white w-48">
                                {viewMode === 'month' && `${monthNames[month]} ${year}`}
                                {viewMode === 'week' && `Week of ${days[0]?.toLocaleDateString('en-GB')}`}
                                {viewMode === 'day' && currentDate.toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h2>
                            <div className="flex bg-[var(--bg-surface)] rounded-md border border-[var(--border-subtle)] p-0.5">
                                <button onClick={prev} className="px-3 py-1 text-sm text-[var(--text-tertiary)] hover:text-white transition-colors">←</button>
                                <div className="w-px bg-[var(--border-subtle)]"></div>
                                <button onClick={today} className="px-3 py-1 text-xs font-mono uppercase text-[var(--text-tertiary)] hover:text-white transition-colors">Today</button>
                                <div className="w-px bg-[var(--border-subtle)]"></div>
                                <button onClick={next} className="px-3 py-1 text-sm text-[var(--text-tertiary)] hover:text-white transition-colors">→</button>
                            </div>
                        </>
                    )}
                    {isCollapsed && <h2 className="text-lg font-medium tracking-tight text-[var(--text-secondary)]">Production Schedule</h2>}
                </div>

                {/* View Switcher & Add Button */}
                {!isCollapsed && (
                    <div className="flex gap-4">
                        <button onClick={() => { setEditingShoot(null); setSelectedColor('indigo'); setSelectedDate(todayDateKeyLocal()); setIsModalOpen(true); }} className="px-3 py-1 text-xs font-medium bg-white text-black rounded hover:bg-gray-200 transition-colors">
                            + Add Event
                        </button>
                        <div className="flex bg-[var(--bg-surface)] rounded-md border border-[var(--border-subtle)] p-0.5">
                            <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-xs uppercase font-medium rounded-sm transition-colors ${viewMode === 'month' ? 'bg-[var(--text-primary)] text-black' : 'text-[var(--text-secondary)] hover:text-white'}`}>Month</button>
                            <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-xs uppercase font-medium rounded-sm transition-colors ${viewMode === 'week' ? 'bg-[var(--text-primary)] text-black' : 'text-[var(--text-secondary)] hover:text-white'}`}>Week</button>
                            <button onClick={() => setViewMode('day')} className={`px-3 py-1 text-xs uppercase font-medium rounded-sm transition-colors ${viewMode === 'day' ? 'bg-[var(--text-primary)] text-black' : 'text-[var(--text-secondary)] hover:text-white'}`}>Day</button>
                        </div>
                    </div>
                )}
            </div>

            {!isCollapsed && (
                <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden bg-[var(--bg-surface)] animate-in fade-in slide-in-from-top-4 duration-300">

                    {/* MONTH VIEW - Classic Grid */}
                    {viewMode === 'month' && (
                        <>
                            <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--bg-root)]">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <div key={day} className="py-2 text-center text-[10px] uppercase font-mono tracking-wider text-[var(--text-tertiary)]">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 auto-rows-fr min-h-[400px]">
                                {days.map((date, idx) => {
                                    if (!date) return <div key={`empty-${idx}`} className="border-b border-r border-[var(--border-subtle)]/50 bg-[var(--bg-root)]/50 min-h-[100px]"></div>;
                                    const dateString = formatDateKeyLocal(date);
                                    const dayShoots = shoots.filter(s => dateKeyFromStored(s.shoot_date) === dateString);
                                    const isToday = new Date().toDateString() === date.toDateString();
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleDateClick(date)}
                                            onDragOver={(e) => handleDragOver(e, dateString)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, dateString)}
                                            className={`border-b border-r border-[var(--border-subtle)]/50 p-2 min-h-[100px] hover:bg-[var(--bg-surface-hover)] cursor-pointer group transition-colors ${isToday ? 'bg-white/[0.02]' : ''} ${dropTarget === dateString ? 'bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/30' : ''}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={`text-xs font-mono mb-2 block ${isToday ? 'text-white font-bold' : 'text-[var(--text-tertiary)]'}`}>{date.getDate()}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {dayShoots.map(shoot => {
                                                    const theme = getTheme(shoot.color);
                                                    return (
                                                        <div
                                                            key={shoot.id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, shoot)}
                                                            onDragEnd={handleDragEnd}
                                                            onClick={(e) => handleEventClick(e, shoot)}
                                                            className={`text-[10px] ${theme.bg} border ${theme.border} ${theme.text} px-1.5 py-0.5 rounded truncate hover:opacity-80 cursor-grab active:cursor-grabbing transition-colors block border-l-2 ${dragShootId === shoot.id ? 'opacity-50' : ''}`}
                                                        >
                                                            <span className="opacity-70 mr-1">{shoot.start_time}</span>
                                                            {shoot.title}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* WEEK & DAY VIEW - Time Grid (responsive: toute la semaine sur mobile) */}
                    {(viewMode === 'week' || viewMode === 'day') && (
                        <div className="flex flex-col bg-[var(--bg-root)] h-[500px] md:h-[600px] overflow-y-auto overflow-x-hidden relative no-scrollbar w-full">
                            {/* Header Row - 7 colonnes égales sur mobile */}
                            <div className="flex border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-root)] z-20 min-w-0">
                                <div className="w-10 md:w-16 border-r border-[var(--border-subtle)] flex-shrink-0"></div>
                                {days.map((date, i) => {
                                    if (!date) return null;
                                    const isToday = new Date().toDateString() === date.toDateString();
                                    return (
                                        <div key={i} className="flex-1 min-w-0 text-center py-2 md:py-3 border-r border-[var(--border-subtle)]/30 last:border-r-0">
                                            <div className={`text-[9px] md:text-xs uppercase font-bold truncate px-0.5 ${isToday ? 'text-indigo-400' : 'text-[var(--text-tertiary)]'}`}>
                                                {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                                            </div>
                                            <div className={`text-xs md:text-sm ${isToday ? 'text-white font-bold' : 'text-[var(--text-secondary)]'}`}>
                                                {date.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Time Grid Body */}
                            <div className="flex relative min-w-0 flex-1">
                                {/* Time Axis (Hours) - plus étroit sur mobile */}
                                <div className="w-10 md:w-16 flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-root)] z-10">
                                    {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                                        <div key={i} className="h-[48px] border-b border-white/[0.03] text-[9px] md:text-[10px] text-[var(--text-tertiary)] text-right pr-1 md:pr-2 pt-1 font-mono">
                                            {START_HOUR + i}h
                                        </div>
                                    ))}
                                </div>

                                {/* Columns - flex-1 min-w-0 pour que toute la semaine tienne à l'écran */}
                                {days.map((date, dayIdx) => {
                                    if (!date) return null;
                                    const dateString = formatDateKeyLocal(date);
                                    const dayShoots = shoots.filter(s => dateKeyFromStored(s.shoot_date) === dateString);

                                    return (
                                        <div key={dayIdx} className="flex-1 min-w-0 border-r border-[var(--border-subtle)]/30 last:border-r-0 relative group">
                                            {/* Horizontal Lines */}
                                            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
                                                const slotHour = START_HOUR + i;
                                                const slotKey = `${dateString}|${slotHour.toString().padStart(2, '0')}:00`;
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`h-[48px] border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors ${dropTarget === slotKey ? 'bg-indigo-500/15 ring-1 ring-inset ring-indigo-500/40' : ''}`}
                                                        onClick={() => handleTimeSlotClick(date, slotHour)}
                                                        onDragOver={(e) => handleDragOver(e, dateString, `${slotHour.toString().padStart(2, '0')}:00`)}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={(e) => handleDrop(e, dateString, slotHour)}
                                                    ></div>
                                                );
                                            })}

                                            {/* Events */}
                                            {dayShoots.map(shoot => {
                                                if (!shoot.start_time) return null; // Only render if time is set
                                                const style = calculateEventStyle(shoot.start_time, shoot.end_time);
                                                const theme = getTheme(shoot.color);
                                                return (
                                                    <div
                                                        key={shoot.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, shoot)}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={(e) => handleEventClick(e, shoot)}
                                                        style={style}
                                                        className={`absolute left-0.5 right-0.5 md:inset-x-1 ${theme.bg} border ${theme.border} rounded overflow-hidden hover:z-10 hover:opacity-90 transition-colors cursor-grab active:cursor-grabbing group-event ${dragShootId === shoot.id ? 'opacity-50 scale-95' : ''}`}
                                                    >
                                                        <div className={`h-full w-full border-l-2 p-0.5 md:p-1 flex flex-col justify-between min-w-0`} style={{ borderLeftColor: theme.dot.replace('bg-', 'rgb(').replace('500', '400') }}>
                                                            <div className={`font-medium ${theme.text} text-[8px] md:text-[10px] leading-tight truncate`}>{shoot.client_company || shoot.client_name}</div>
                                                            {parseInt(style.height as string) > 22 && (
                                                                <div className={`text-[8px] md:text-[10px] ${theme.text} opacity-80 truncate`}>{shoot.title}</div>
                                                            )}
                                                            {parseInt(style.height as string) > 36 && (
                                                                <div className={`text-[7px] md:text-[9px] ${theme.text} opacity-60 truncate`}>{shoot.start_time} - {shoot.end_time}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
