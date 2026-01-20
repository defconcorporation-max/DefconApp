
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, DollarSign, Briefcase, Calendar, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const AgentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [agent, setAgent] = useState(null);
    const [clients, setClients] = useState([]);
    const [stats, setStats] = useState({ activeClients: 0, upcomingTrips: 0, totalRevenue: 0, totalCommission: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgentDetails();
    }, [id]);

    const fetchAgentDetails = async () => {
        try {
            const res = await fetch(`${API_URL}/api/agents/${id}/details`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAgent(data.agent);
                setClients(data.clients || []);
                setStats(data.stats || {});
            }
        } catch (error) {
            console.error('Error fetching agent details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">Loading...</div>;
    if (!agent) return <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">Agent not found</div>;

    return (
        <div className="min-h-screen bg-dark-900 text-white font-sans">
            <header className="bg-dark-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
                    <Link to="/admin/agents" className="p-2 hover:bg-white/5 rounded-full transition">
                        <ArrowLeft size={20} className="text-slate-400" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users className="text-primary-500" size={20} />
                            {agent.name}
                        </h1>
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Agent Profile</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-dark-800 p-6 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 mb-2 text-slate-400">
                            <DollarSign size={18} className="text-green-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                        </div>
                        <p className="text-2xl font-bold text-white">${stats.totalRevenue?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="bg-dark-800 p-6 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 mb-2 text-slate-400">
                            <DollarSign size={18} className="text-primary-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">Commission Earned</span>
                        </div>
                        <p className="text-2xl font-bold text-white">${stats.totalCommission?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="bg-dark-800 p-6 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 mb-2 text-slate-400">
                            <Briefcase size={18} className="text-blue-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">Active Clients</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.activeClients}</p>
                    </div>
                    <div className="bg-dark-800 p-6 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 mb-2 text-slate-400">
                            <Calendar size={18} className="text-purple-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">Upcoming Trips</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.upcomingTrips}</p>
                    </div>
                </div>

                {/* Revenue Graph */}
                {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
                    <div className="bg-dark-800 p-6 rounded-xl border border-white/5 mb-8">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <DollarSign size={20} className="text-emerald-500" />
                            Revenue History
                        </h2>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.monthlyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#94a3b8"
                                        tickFormatter={(value) => {
                                            const [year, month] = value.split('-');
                                            const date = new Date(year, month - 1);
                                            return date.toLocaleString('default', { month: 'short' });
                                        }}
                                        tick={{ fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        tick={{ fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                                        cursor={{ fill: '#ffffff05' }}
                                        formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                                    />
                                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Clients List */}
                <div className="bg-dark-800 rounded-xl border border-white/5 overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-lg font-bold text-white">Assigned Clients</h2>
                    </div>
                    <div className="divide-y divide-white/5">
                        {clients.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No clients assigned yet.</div>
                        ) : (
                            clients.map(client => (
                                <div key={client._id || client.id} className="p-4 hover:bg-white/5 transition flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center font-bold">
                                            {client.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{client.name}</h3>
                                            <p className="text-xs text-slate-500">{client.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => navigate(`/dashboard/client/${client.id || client._id}`)}
                                            className="px-3 py-1.5 bg-primary-500/10 text-primary-500 rounded-lg text-xs font-bold hover:bg-primary-500 hover:text-white transition"
                                        >
                                            Manage
                                        </button>
                                        <a
                                            href={`/client/${client.id || client._id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-slate-400 hover:text-white transition"
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AgentDetails;
