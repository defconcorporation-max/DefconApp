
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Search, ExternalLink, TrendingUp, Calendar, DollarSign, Briefcase, Trash2, Archive, RefreshCcw, Settings, Home, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';

const localizer = momentLocalizer(moment);

import API_URL from '../config';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [itineraries, setItineraries] = useState([]); // Store all itineraries to checks for "completeness"
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
    const [showArchived, setShowArchived] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', booking_ref: '', trip_start: '', trip_end: '' });
    const [stats, setStats] = useState({ totalClients: 0, activeTrips: 0, upcomingDepartures: 0, revenue: 0 });
    const [adminStats, setAdminStats] = useState({ totalProfit: 0 });
    const [chartData, setChartData] = useState([]);
    const { user, token, logout } = useAuth(); // Get token

    useEffect(() => {
        if (token) {
            fetchData();
            fetchAdminStats();
        }
    }, [token, user]);

    const fetchData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            // 1. Fetch Client List (Always use /api/clients for correct list based on role)
            const clientsRes = await fetch(`${API_URL}/api/clients`, { headers });
            let clientsData = [];
            if (clientsRes.ok) {
                clientsData = await clientsRes.json();
                setClients(clientsData);
            }

            // 2. Fetch Detailed Stats for Graphs (Try for Agent Stats first)
            const endpoint = `${API_URL}/api/agents/${user.id}/details`;
            const [detailsRes, itinerariesRes] = await Promise.all([
                fetch(endpoint, { headers }),
                fetch(`${API_URL}/api/itineraries`) // Needed for fallback or other logic
            ]);

            if (detailsRes.ok) {
                const data = await detailsRes.json();

                // Use server-side stats if available
                if (data.stats) {
                    // Calculate active trips locally since server stats might be slightly different or for safety
                    const now = new Date();
                    const currentActiveTrips = (clientsData || []).filter(c =>
                        c.trip_start && c.trip_end && new Date(c.trip_start) <= now && new Date(c.trip_end) >= now
                    ).length;

                    setStats({
                        totalClients: clientsData.length, // Use the fetched list length
                        activeTrips: currentActiveTrips,
                        upcomingDepartures: data.stats.upcomingTrips,
                        revenue: data.stats.totalRevenue,
                        monthlyRevenue: data.stats.monthlyRevenue,
                        totalCommission: data.stats.totalCommission
                    });
                }
            } else {
                // Fallback if details fail (e.g. Admin without "Agent" entry self-check?)
                // If Admin, use generic stats logic based on the fetched clients
                console.warn("Agent details fetch failed or denied, falling back to basic stats");
                const now = new Date();
                const active = clientsData.filter(c => c.trip_start && c.trip_end && new Date(c.trip_start) <= now && new Date(c.trip_end) >= now).length;
                const upcoming = clientsData.filter(c => c.trip_start && new Date(c.trip_start) > now).length;

                // Calculate revenue from itineraries
                const itinerariesData = await itinerariesRes.clone().json().catch(() => []);
                // Filter itineraries? If Admin, we see all itineraries for all clients?
                // The /api/itineraries endpoint returns ALL itineraries currently (based on server code check) or filtered?
                // Let's assume naive sum for fallback.
                const revenue = itinerariesData.reduce((acc, item) => acc + (item.cost || 0), 0);

                setStats({
                    totalClients: clientsData.length,
                    activeTrips: active,
                    upcomingDepartures: upcoming,
                    revenue: revenue
                    // No monthlyRevenue graphs in fallback
                });
            }

            const itinerariesData = await itinerariesRes.json();
            setItineraries(itinerariesData);

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchAdminStats = async () => {
        if (user?.role === 'admin') {
            try {
                const adminStatsRes = await fetch(`${API_URL}/api/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (adminStatsRes.ok) {
                    const adminData = await adminStatsRes.json();
                    setAdminStats(adminData);
                }
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            }
        }
    };

    // Removed calculateStats as we use server data now
    // But we need to ensure chartData is populated for the old chart if we keep it?
    // User wants "same view as agent page", so we replace the old chart with new charts.

    const handleAddClient = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newClient),
            });
            if (res.ok) {
                setShowAddModal(false);
                setNewClient({ name: '', email: '', phone: '', booking_ref: '', trip_start: '', trip_end: '' });
                fetchData();
            }
        } catch (error) {
            console.error('Error adding client:', error);
        }
    };

    const handleDeleteClient = async (clientId) => {
        if (window.confirm('Are you sure you want to delete this client? This will also delete all their itinerary items.')) {
            try {
                const res = await fetch(`${API_URL}/api/clients/${clientId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    // Optimistic update
                    setClients(clients.filter(c => c.id !== clientId));
                    // Recalculate stats with the new list
                    const newClients = clients.filter(c => c.id !== clientId);
                    // We need to refetch to get updated stats correctly or filter itineraries too, 
                    // but simply refetching is safer for consistency
                    fetchData();
                }
            } catch (error) {
                console.error('Error deleting client:', error);
            }
        }
    };

    const handleToggleArchive = async (client) => {
        try {
            const updatedClient = { ...client, isArchived: !client.isArchived };
            const res = await fetch(`${API_URL}/api/clients/${client.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedClient),
            });

            if (res.ok) {
                // Optimistic update
                setClients(clients.map(c => c.id === client.id ? updatedClient : c));
            }
        } catch (error) {
            console.error('Error updating client archive status:', error);
        }
    };

    // Filter clients based on archive status
    const filteredClients = clients.filter(client =>
        showArchived ? client.isArchived : !client.isArchived
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const [showSettingsModal, setShowSettingsModal] = useState(false);

    return (
        <div className="flex h-screen bg-dark-900 text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-dark-900 border-r border-white/5 flex flex-col flex-shrink-0 z-20">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
                        <Users className="text-primary-500" />
                        <span className="text-primary-500">Viva Vegas</span>
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-700">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-500/10 text-primary-500 transition font-medium"
                    >
                        <Briefcase size={20} />
                        <span>Dashboard</span>
                    </button>

                    {user?.role === 'admin' && (
                        <Link
                            to="/admin/agents"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition font-medium"
                        >
                            <Users size={20} />
                            <span>Manage Agents</span>
                        </Link>
                    )}

                    <Link
                        to="/catalog"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition font-medium"
                    >
                        <Briefcase size={20} /> {/* Reusing Briefcase or maybe BookOpen if imported */}
                        <span>Catalog</span>
                    </Link>

                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition font-medium"
                    >
                        <TrendingUp size={20} /> {/* Placeholder icon for settings, should import Settings */}
                        <span>Settings</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user?.role === 'admin' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                            {user?.role === 'admin' ? 'AD' : 'AG'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || user?.username || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition font-medium text-sm"
                    >
                        <ExternalLink size={18} className="rotate-180" /> {/* Logout icon approximation */}
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-dark-950 relative">
                {/* Top Header (Content only) */}
                <header className="sticky top-0 z-10 bg-dark-950/80 backdrop-blur-md px-8 py-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Overview</h2>
                        <p className="text-slate-500 text-sm">Welcome back, {user?.username}!</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-primary-500 text-white px-5 py-2.5 rounded-full hover:bg-primary-600 transition flex items-center gap-2 shadow-lg shadow-primary-500/20 font-bold"
                        >
                            <Plus size={18} />
                            New Client
                        </button>
                    </div>
                </header>

                <div className="px-8 pb-8">

                    {/* Stats Section */}
                    {user?.role === 'admin' && (
                        <div className="mb-8 bg-dark-800 rounded-2xl p-6 border border-white/5 flex items-center justify-between shadow-lg shadow-black/20">
                            <div>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Agency Profit</h2>
                                <p className="text-4xl font-bold text-white flex items-center gap-2">
                                    <DollarSign className="text-emerald-500" size={32} />
                                    {adminStats.totalProfit ? adminStats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                </p>
                            </div>
                            <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20">
                                <DollarSign className="text-emerald-500" size={40} />
                            </div>
                        </div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
                    >
                        <StatsCard icon={<Users className="text-blue-400" />} title="Total Clients" value={stats.totalClients} />
                        <StatsCard icon={<Briefcase className="text-purple-400" />} title="Active Trips" value={stats.activeTrips} />
                        <StatsCard icon={<Calendar className="text-emerald-400" />} title="Upcoming" value={stats.upcomingDepartures} />
                        <StatsCard icon={<DollarSign className="text-primary-500" />} title="Est. Revenue" value={`$${stats.revenue.toLocaleString()}`} />
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Client List */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="lg:col-span-2"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-bold text-white">
                                        {showArchived ? 'Archived Clients' : 'Recent Clients'}
                                    </h2>
                                    <div className="flex gap-1 bg-dark-800/50 p-1 rounded-lg border border-white/5">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                            title="List View"
                                        >
                                            <Briefcase size={16} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('calendar')}
                                            className={`p-1.5 rounded-md transition ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                            title="Calendar View"
                                        >
                                            <Calendar size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowArchived(!showArchived)}
                                        className={`text-xs font-medium px-3 py-1.5 rounded-full transition border ${showArchived
                                            ? 'bg-primary-500/20 text-primary-400 border-primary-500/50'
                                            : 'bg-dark-800 text-slate-400 border-white/5 hover:text-white'}`}
                                    >
                                        {showArchived ? 'Show Active' : 'Show Archived'}
                                    </button>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search clients..."
                                            className="pl-10 pr-4 py-2 bg-dark-800/50 border border-white/5 rounded-full text-sm text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none w-48 transition-all focus:w-64"
                                        />
                                    </div>
                                </div>
                            </div>

                            {viewMode === 'list' ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredClients.map((client) => {
                                        const clientItineraryCount = itineraries.filter(i => i.client_id === client.id).length;
                                        const isComplete = clientItineraryCount > 0;

                                        return (
                                            <motion.div
                                                key={client.id}
                                                variants={itemVariants}
                                                className={`bg-dark-800/40 rounded-xl p-5 hover:bg-dark-800 transition group flex items-center justify-between border border-transparent hover:border-white/5 ${client.isSchedulePending ? 'opacity-50 hover:opacity-100' : ''}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-primary-500 font-bold">
                                                        {client.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition">{client.name}</h3>
                                                        <p className="text-sm text-slate-500">{client.email}</p>
                                                        {client.isSchedulePending && (
                                                            <span className="text-[10px] uppercase tracking-wider text-orange-400 font-bold mt-1 inline-block">Pending Schedule</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider">Reference</p>
                                                        <p className="text-sm text-white font-mono">{client.booking_ref}</p>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Link
                                                            to={`/dashboard/client/${client.id || client._id}`}
                                                            className="px-4 py-2 bg-white/5 text-slate-200 rounded-lg hover:bg-white/10 transition text-sm font-medium"
                                                        >
                                                            Manage
                                                        </Link>
                                                        <Link
                                                            to={`/client/${client.id || client._id}`}
                                                            target="_blank"
                                                            className="p-2 text-slate-500 hover:text-primary-400 transition"
                                                            title="View Client App"
                                                        >
                                                            <ExternalLink size={20} />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleToggleArchive(client)}
                                                            className={`p-2 transition ${client.isArchived ? 'text-green-500 hover:text-green-400' : 'text-slate-500 hover:text-orange-400'}`}
                                                            title={client.isArchived ? "Unarchive" : "Archive"}
                                                        >
                                                            {client.isArchived ? <RefreshCcw size={20} /> : <Archive size={20} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClient(client.id || client._id)}
                                                            className="p-2 text-slate-500 hover:text-red-500 transition"
                                                            title="Delete Client"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                    {filteredClients.length === 0 && (
                                        <div className="text-center py-16 bg-dark-800/30 rounded-xl border border-dashed border-white/10">
                                            <div className="bg-dark-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Users className="text-slate-600" size={32} />
                                            </div>
                                            <h3 className="text-lg font-medium text-white">No clients found</h3>
                                            <p className="text-slate-500 mt-2">
                                                {showArchived ? "No archived clients." : "Get started by adding your first client."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-[600px] bg-dark-800/40 p-6 rounded-xl border border-white/5 text-xs">
                                    <BigCalendar
                                        localizer={localizer}
                                        events={clients.filter(c => c.trip_start && c.trip_end).map(c => ({
                                            id: c.id || c._id,
                                            title: c.name,
                                            start: new Date(c.trip_start),
                                            end: new Date(c.trip_end),
                                            resource: c
                                        }))}
                                        startAccessor="start"
                                        endAccessor="end"
                                        style={{ height: '100%' }}
                                        views={['month', 'agenda']}
                                        defaultView="month"
                                        onSelectEvent={event => navigate(`/dashboard/client/${event.resource.id}`)}
                                        eventPropGetter={() => ({
                                            style: {
                                                backgroundColor: '#F97316',
                                                borderRadius: '4px',
                                                opacity: 0.8,
                                                color: 'white',
                                                border: '0px',
                                                display: 'block'
                                            }
                                        })}
                                    />
                                </div>
                            )}
                        </motion.div>

                        {/* Analytics Chart */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="lg:col-span-1"
                        >
                            <div className="sticky top-24 space-y-6">
                                {/* Revenue & Commission Graphs from Agent View */}
                                {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
                                    <>
                                        {/* Total Sales Graph */}
                                        <div className="bg-dark-800/40 rounded-xl p-6 border border-white/5">
                                            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                                <DollarSign size={16} className="text-emerald-500" />
                                                Sales Trend
                                            </h2>
                                            <div className="h-40 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={stats.monthlyRevenue}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                        <XAxis
                                                            dataKey="month"
                                                            stroke="#64748b"
                                                            tickFormatter={(value) => {
                                                                const [year, month] = value.split('-');
                                                                const date = new Date(year, month - 1);
                                                                return date.toLocaleString('default', { month: 'short' });
                                                            }}
                                                            tick={{ fontSize: 10 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            stroke="#64748b"
                                                            tick={{ fontSize: 10 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tickFormatter={(value) => `$${value}`}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                                                            cursor={{ fill: '#ffffff05' }}
                                                            formatter={(value) => [`$${value.toLocaleString()}`, 'Sales']}
                                                        />
                                                        <Bar dataKey="revenue" fill="#10b981" radius={[2, 2, 0, 0]} barSize={20} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Total Commission Graph */}
                                        <div className="bg-dark-800/40 rounded-xl p-6 border border-white/5">
                                            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                                <DollarSign size={16} className="text-primary-500" />
                                                Commission Trend
                                            </h2>
                                            <div className="h-40 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={stats.monthlyRevenue}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                        <XAxis
                                                            dataKey="month"
                                                            stroke="#64748b"
                                                            tickFormatter={(value) => {
                                                                const [year, month] = value.split('-');
                                                                const date = new Date(year, month - 1);
                                                                return date.toLocaleString('default', { month: 'short' });
                                                            }}
                                                            tick={{ fontSize: 10 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            stroke="#64748b"
                                                            tick={{ fontSize: 10 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tickFormatter={(value) => `$${value}`}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                                                            cursor={{ fill: '#ffffff05' }}
                                                            formatter={(value) => [`$${value.toLocaleString()}`, 'Commission']}
                                                        />
                                                        <Bar dataKey="commission" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={20} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-dark-800/40 rounded-xl p-6 border border-white/5 text-center text-slate-500">
                                        No revenue data available
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-dark-800 w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings className="text-primary-500" /> Settings
                            </h3>
                            <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white transition">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 flex items-start gap-3">
                                <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Application Config</h4>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Global application settings will appear here. configuring commissions, default values, and integrations.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Account</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-3 bg-dark-900 rounded-lg border border-white/5">
                                        <span className="text-sm font-medium text-slate-300">Profile Name</span>
                                        <span className="text-sm text-white">{user?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-dark-900 rounded-lg border border-white/5">
                                        <span className="text-sm font-medium text-slate-300">Role</span>
                                        <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded text-white uppercase">{user?.role}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <p className="text-xs text-slate-600 text-center">
                                    Viva Vegas App v1.0.2 &bull; Build 2026.01.19
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Add Client Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-dark-800 rounded-2xl max-w-md w-full p-8 border border-white/10 shadow-2xl"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-white">Add New Client</h2>
                        <form onSubmit={handleAddClient} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder-slate-600 transition-all"
                                    value={newClient.name}
                                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder-slate-600 transition-all"
                                    value={newClient.email}
                                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder-slate-600 transition-all"
                                    value={newClient.phone}
                                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Booking Reference</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder-slate-600 transition-all"
                                    value={newClient.booking_ref}
                                    onChange={e => setNewClient({ ...newClient, booking_ref: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Trip Start</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 [color-scheme:dark] transition-all"
                                        value={newClient.trip_start || ''}
                                        onChange={e => setNewClient({ ...newClient, trip_start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Trip End</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 [color-scheme:dark] transition-all"
                                        value={newClient.trip_end || ''}
                                        onChange={e => setNewClient({ ...newClient, trip_end: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Notes (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder-slate-600 h-20 transition-all"
                                    value={newClient.notes || ''}
                                    onChange={e => setNewClient({ ...newClient, notes: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Preferences (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder-slate-600 h-20 transition-all"
                                    value={newClient.preferences || ''}
                                    onChange={e => setNewClient({ ...newClient, preferences: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-3 border border-dark-600 text-slate-300 rounded-lg hover:bg-dark-700 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium shadow-lg shadow-primary-500/20"
                                >
                                    Add Client
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const StatsCard = ({ icon, title, value }) => (
    <div className="bg-dark-800/40 rounded-xl p-6 border border-white/5 flex items-center gap-4 hover:bg-dark-800/60 transition">
        <div className="p-3 bg-dark-800 rounded-lg border border-white/5">
            {icon}
        </div>
        <div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
    </div>
);

export default Dashboard;
