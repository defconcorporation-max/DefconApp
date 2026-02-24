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
    Bar
} from 'recharts';

interface AnalyticsChartsProps {
    volumeData: { month: string, count: number }[];
    originData: { name: string, value: number }[];
    completionData: { name: string, value: number }[];
}

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#6366f1', '#ec4899'];

export default function AnalyticsCharts({ volumeData, originData, completionData }: AnalyticsChartsProps) {

    // Format Month data for better readability (e.g., '2025-01' -> 'Jan 2025')
    const formatMonth = (tickItem: string) => {
        if (!tickItem) return '';
        const [year, month] = tickItem.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Shoot Volume (Line Chart) */}
            <div className="pro-dashboard-card p-6 rounded-2xl lg:col-span-2">
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

            {/* Business Origin (Pie Chart) */}
            <div className="pro-dashboard-card p-6 rounded-2xl">
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

        </div>
    );
}
