'use client';
import { useState } from 'react';
import { ShootWithClient, addShoot, updateShoot, deleteShoot, getProjects } from '@/app/actions';

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
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week'); // Default to Week
    const [isCollapsed, setIsCollapsed] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShoot, setEditingShoot] = useState<ShootWithClient | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [availableProjects, setAvailableProjects] = useState<any[]>([]); // New State
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('indigo'); // Default color

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
        const dateString = date.toISOString().split('T')[0];
        setSelectedDate(dateString);
        setSelectedTime('09:00');
        setIsModalOpen(true);
    };

    const handleTimeSlotClick = (date: Date, hour: number, minute: number = 0) => {
        setEditingShoot(null);
        setSelectedColor('indigo');
        const dateString = date.toISOString().split('T')[0];
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

    // Modal Component
    const Modal = () => (
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
                                const cid = Number(e.target.value);
                                getProjects(cid).then(projs => setAvailableProjects(projs));
                            }}
                            className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] text-white text-sm rounded px-2 py-2 focus:border-[var(--text-secondary)] outline-none"
                            required
                        >
                            <option value="">-- Select Client --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.company_name || c.name}</option>
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
                            <option value="">-- No Project --</option>
                            {availableProjects.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
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
                                    <option key={time} value={time}>{time}</option>
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
                            <option value="">-- No End Time --</option>
                            {timeSlots.map(time => (
                                <option key={time} value={time}>{time}</option>
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
    );

    return (
        <section className={`mb-12 transition-all duration-300 relative ${isCollapsed ? 'mb-8' : ''}`}>
            {isModalOpen && <Modal />}

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
                        <button onClick={() => { setEditingShoot(null); setSelectedColor('indigo'); setSelectedDate(new Date().toISOString().split('T')[0]); setIsModalOpen(true); }} className="px-3 py-1 text-xs font-medium bg-white text-black rounded hover:bg-gray-200 transition-colors">
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
                                    const dateString = date.toISOString().split('T')[0];
                                    const dayShoots = shoots.filter(s => s.shoot_date === dateString);
                                    const isToday = new Date().toDateString() === date.toDateString();
                                    return (
                                        <div key={idx} onClick={() => handleDateClick(date)} className={`border-b border-r border-[var(--border-subtle)]/50 p-2 min-h-[100px] hover:bg-[var(--bg-surface-hover)] cursor-pointer group ${isToday ? 'bg-white/[0.02]' : ''}`}>
                                            <div className="flex justify-between items-start">
                                                <span className={`text-xs font-mono mb-2 block ${isToday ? 'text-white font-bold' : 'text-[var(--text-tertiary)]'}`}>{date.getDate()}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {dayShoots.map(shoot => {
                                                    const theme = getTheme(shoot.color);
                                                    return (
                                                        <div key={shoot.id} onClick={(e) => handleEventClick(e, shoot)} className={`text-[10px] ${theme.bg} border ${theme.border} ${theme.text} px-1.5 py-0.5 rounded truncate hover:opacity-80 cursor-pointer transition-colors block border-l-2`}>
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

                    {/* WEEK & DAY VIEW - Time Grid */}
                    {(viewMode === 'week' || viewMode === 'day') && (
                        <div className="flex flex-col bg-[var(--bg-root)] h-[600px] overflow-y-auto relative no-scrollbar">
                            {/* Header Row */}
                            <div className="flex border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-root)] z-20">
                                <div className="w-16 border-r border-[var(--border-subtle)] flex-shrink-0"></div>
                                {days.map((date, i) => {
                                    if (!date) return null;
                                    const isToday = new Date().toDateString() === date.toDateString();
                                    return (
                                        <div key={i} className="flex-1 text-center py-3 border-r border-[var(--border-subtle)]/30 min-w-[100px]">
                                            <div className={`text-xs uppercase font-bold ${isToday ? 'text-indigo-400' : 'text-[var(--text-tertiary)]'}`}>
                                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </div>
                                            <div className={`text-sm ${isToday ? 'text-white font-bold' : 'text-[var(--text-secondary)]'}`}>
                                                {date.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Time Grid Body */}
                            <div className="flex relative">
                                {/* Time Axis (Hours) */}
                                <div className="w-16 flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-root)] z-10">
                                    {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                                        <div key={i} className="h-[48px] border-b border-white/[0.03] text-[10px] text-[var(--text-tertiary)] text-right pr-2 pt-1 font-mono relative">
                                            <span className="-top-2 relative">{START_HOUR + i}:00</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Columns */}
                                {days.map((date, dayIdx) => {
                                    if (!date) return null;
                                    const dateString = date.toISOString().split('T')[0];
                                    const dayShoots = shoots.filter(s => s.shoot_date === dateString);

                                    return (
                                        <div key={dayIdx} className="flex-1 border-r border-[var(--border-subtle)]/30 relative min-w-[100px] group">
                                            {/* Horizontal Lines */}
                                            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="h-[48px] border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                                                    onClick={() => handleTimeSlotClick(date, START_HOUR + i)}
                                                ></div>
                                            ))}

                                            {/* Events */}
                                            {dayShoots.map(shoot => {
                                                if (!shoot.start_time) return null; // Only render if time is set
                                                const style = calculateEventStyle(shoot.start_time, shoot.end_time);
                                                const theme = getTheme(shoot.color);
                                                return (
                                                    <div
                                                        key={shoot.id}
                                                        onClick={(e) => handleEventClick(e, shoot)}
                                                        style={style}
                                                        className={`absolute inset-x-1 ${theme.bg} border ${theme.border} rounded overflow-hidden hover:z-10 hover:opacity-90 transition-colors cursor-pointer group-event`}
                                                    >
                                                        <div className={`h-full w-full border-l-2 p-1 flex flex-col justify-between`} style={{ borderLeftColor: theme.dot.replace('bg-', 'rgb(').replace('500', '400') }}>
                                                            <div className={`font-medium ${theme.text} text-[10px] leading-tight truncate`}>{shoot.client_company || shoot.client_name}</div>
                                                            {parseInt(style.height as string) > 25 && (
                                                                <div className={`text-[10px] ${theme.text} opacity-80 truncate`}>{shoot.title}</div>
                                                            )}
                                                            {parseInt(style.height as string) > 40 && (
                                                                <div className={`text-[9px] ${theme.text} opacity-60`}>{shoot.start_time} - {shoot.end_time}</div>
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
