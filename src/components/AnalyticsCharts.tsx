'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    AreaChart,
    Area
} from 'recharts';
import { Download } from 'lucide-react';

interface AnalyticsChartsProps {
    volumeData: { month: string, count: number }[];
    originData: { name: string, value: number }[];
    completionData: { name: string, value: number }[];
    revenueData?: { month: string, revenue: number }[];
    topClientsData?: { name: string, value: number }[];
    teamUtilizationData?: { name: string, value: number }[];
}

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#6366f1', '#ec4899'];

export default function AnalyticsCharts({ volumeData, originData, completionData, revenueData = [], topClientsData = [], teamUtilizationData = [] }: AnalyticsChartsProps) {

    // Format Month data for better readability (e.g., '2025-01' -> 'Jan 2025')
    const formatMonth = (tickItem: string) => {
        if (!tickItem) return '';
        const [year, month] = tickItem.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
    };

    const exportToCSV = (data: any[], filename: string) => {
        if (!data || data.length === 0) return;
        const keys = Object.keys(data[0]);
        const csvContent = [
            keys.join(','),
            ...data.map(row => keys.map(k => {
                let val = row[k];
                if (typeof val === 'string') {
                    val = `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            {/* Financial Overview - Full Width Revenue Chart */}
            {revenueData.length > 0 && (
                <div className="pro-dashboard-card p-6 rounded-2xl relative group">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Monthly Revenue (Last 12 Months)</h3>
                        <button
                            onClick={() => exportToCSV(revenueData, 'monthly_revenue.csv')}
                            className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            title="Export to CSV"
                        >
                            <Download size={16} />
                        </button>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    stroke="#888"
                                    fontSize={12}
                                    tickFormatter={formatMonth}
                                    tickMargin={10}
                                />
                                <YAxis stroke="#888" fontSize={12} tickFormatter={(val) => `$${val}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelFormatter={(label: any) => formatMonth(label as string)}
                                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Clients by Revenue (Horizontal Bar Chart) */}
                {topClientsData.length > 0 && (
                    <div className="pro-dashboard-card p-6 rounded-2xl lg:col-span-2 relative group">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Top Clients by Revenue</h3>
                            <button
                                onClick={() => exportToCSV(topClientsData, 'top_clients_revenue.csv')}
                                className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                title="Export to CSV"
                            >
                                <Download size={16} />
                            </button>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topClientsData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#888" fontSize={12} tickFormatter={(val) => `$${val}`} />
                                    <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} width={100} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                        cursor={{ fill: '#ffffff10' }}
                                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {topClientsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Shoot Volume (Line Chart) */}
                <div className="pro-dashboard-card p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6">Production Volume (Last 12 Months)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={volumeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    stroke="#888"
                                    fontSize={12}
                                    tickFormatter={formatMonth}
                                    tickMargin={10}
                                />
                                <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelFormatter={(label: any) => formatMonth(label as string)}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    name="Shoots"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#a78bfa' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Project Completion (Bar Chart) */}
                <div className="pro-dashboard-card p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6">Project Status Breakdown</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={completionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                                <XAxis type="number" stroke="#888" fontSize={12} allowDecimals={false} />
                                <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                    cursor={{ fill: '#ffffff10' }}
                                />
                                <Bar dataKey="value" name="Projects" radius={[0, 4, 4, 0]}>
                                    {completionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Team Utilization (Bar Chart) */}
                {teamUtilizationData.length > 0 && (
                    <div className="pro-dashboard-card p-6 rounded-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Team Utilization (Past Year)</h3>
                            <button
                                onClick={() => exportToCSV(teamUtilizationData, 'team_utilization.csv')}
                                className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                title="Export to CSV"
                            >
                                <Download size={16} />
                            </button>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={teamUtilizationData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#888" fontSize={12} />
                                    <YAxis type="number" stroke="#888" fontSize={12} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                        cursor={{ fill: '#ffffff10' }}
                                        formatter={(value: number) => [value, 'Shoots Assigned']}
                                    />
                                    <Bar dataKey="value" name="Shoots" radius={[4, 4, 0, 0]}>
                                        {teamUtilizationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Business Origin (Pie Chart) */}
                <div className="pro-dashboard-card p-6 rounded-2xl lg:col-span-2">
                    <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6">Business Origin</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        {originData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={originData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        label={({ name, percent }: any) => percent !== undefined ? `${name} ${(percent * 100).toFixed(0)}%` : name}
                                        labelLine={false}
                                    >
                                        {originData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-[var(--text-tertiary)] text-sm">No data available</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
