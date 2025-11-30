
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Search, ExternalLink, TrendingUp, Calendar, DollarSign, Briefcase, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';

const localizer = momentLocalizer(moment);

import API_URL from '../config';

const Dashboard = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
    const [showAddModal, setShowAddModal] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', booking_ref: '', trip_start: '', trip_end: '' });
    const [stats, setStats] = useState({ totalClients: 0, activeTrips: 0, upcomingDepartures: 0, revenue: 0 });
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [clientsRes, itinerariesRes] = await Promise.all([
                fetch(`${API_URL}/api/clients`),
                fetch(`${API_URL}/api/itineraries`)
            ]);

            const clientsData = await clientsRes.json();
            const itinerariesData = await itinerariesRes.json();

            setClients(clientsData);
            calculateStats(clientsData, itinerariesData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const calculateStats = (clientsData, itinerariesData) => {
        const now = new Date();
        const active = clientsData.filter(c => c.trip_start && c.trip_end && new Date(c.trip_start) <= now && new Date(c.trip_end) >= now).length;
        const upcoming = clientsData.filter(c => c.trip_start && new Date(c.trip_start) > now).length;

        // Real Revenue Calculation: Sum of all itinerary item costs
        const revenue = itinerariesData.reduce((acc, item) => acc + (item.cost || 0), 0);

        setStats({
            totalClients: clientsData.length,
            activeTrips: active,
            upcomingDepartures: upcoming,
            revenue: revenue
        });

        // Calculate Monthly Bookings
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const bookingsByMonth = new Array(12).fill(0);

        clientsData.forEach(client => {
            if (client.trip_start) {
                const monthIndex = new Date(client.trip_start).getMonth();
                bookingsByMonth[monthIndex]++;
            }
        });

        // Create chart data for current year (or just show all months)
        const formattedChartData = months.map((month, index) => ({
            name: month,
            bookings: bookingsByMonth[index]
        }));

        setChartData(formattedChartData);
    };

    const handleAddClient = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    return (
        <div className="min-h-screen bg-dark-900 text-white font-sans">
            {/* Header */}
            <header className="bg-dark-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
                        <Users className="text-primary-500" />
                        <span className="text-primary-500">Viva Vegas</span> <span className="text-slate-400 font-light">Dashboard</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <Link to="/catalog" className="px-4 py-2 text-slate-400 hover:text-white transition font-medium text-sm">
                            Manage Catalog
                        </Link>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-primary-500 text-white px-5 py-2 rounded-full hover:bg-primary-600 transition flex items-center gap-2 shadow-lg shadow-primary-500/20 font-medium"
                        >
                            <Plus size={18} />
                            New Client
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Stats Section */}
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
                                <h2 className="text-xl font-bold text-white">Recent Clients</h2>
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
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    className="pl-10 pr-4 py-2 bg-dark-800/50 border border-white/5 rounded-full text-sm text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none w-64 transition-all focus:w-72"
                                />
                            </div>
                        </div>

                        {viewMode === 'list' ? (
                            <div className="grid grid-cols-1 gap-4">
                                {clients.map((client) => (
                                    <motion.div
                                        key={client.id}
                                        variants={itemVariants}
                                        className="bg-dark-800/40 rounded-xl p-5 hover:bg-dark-800 transition group flex items-center justify-between border border-transparent hover:border-white/5"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-primary-500 font-bold">
                                                {client.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition">{client.name}</h3>
                                                <p className="text-sm text-slate-500">{client.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">Reference</p>
                                                <p className="text-sm text-white font-mono">{client.booking_ref}</p>
                                            </div>

                                            <div className="flex gap-2">
                                                <Link
                                                    to={`/dashboard/client/${client.id}`}
                                                    className="px-4 py-2 bg-white/5 text-slate-200 rounded-lg hover:bg-white/10 transition text-sm font-medium"
                                                >
                                                    Manage
                                                </Link>
                                                <Link
                                                    to={`/client/${client.id}`}
                                                    target="_blank"
                                                    className="p-2 text-slate-500 hover:text-primary-400 transition"
                                                    title="View Client App"
                                                >
                                                    <ExternalLink size={20} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteClient(client.id)}
                                                    className="p-2 text-slate-500 hover:text-red-500 transition"
                                                    title="Delete Client"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {clients.length === 0 && (
                                    <div className="text-center py-16 bg-dark-800/30 rounded-xl border border-dashed border-white/10">
                                        <div className="bg-dark-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users className="text-slate-600" size={32} />
                                        </div>
                                        <h3 className="text-lg font-medium text-white">No clients yet</h3>
                                        <p className="text-slate-500 mt-2">Get started by adding your first client.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-[600px] bg-dark-800/40 p-6 rounded-xl border border-white/5 text-xs">
                                <BigCalendar
                                    localizer={localizer}
                                    events={clients.filter(c => c.trip_start && c.trip_end).map(c => ({
                                        id: c.id,
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
                        <div className="bg-dark-800/40 rounded-xl p-6 border border-white/5 sticky top-24">
                            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <TrendingUp className="text-primary-500" size={20} />
                                Monthly Bookings
                            </h2>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                        />
                                        <Bar dataKey="bookings" fill="#F97316" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Total this year</span>
                                    <span className="text-white font-bold text-lg">{stats.totalClients}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

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
