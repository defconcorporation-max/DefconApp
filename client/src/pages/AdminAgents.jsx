import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import { Users, UserPlus, Shield, ArrowLeft } from 'lucide-react';

const AdminAgents = () => {
    const { token } = useAuth();
    const [agents, setAgents] = useState([]);
    const [newAgent, setNewAgent] = useState({ username: '', password: '', name: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAgents();
    }, [token]);

    const fetchAgents = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auth/agents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAgents(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAgent = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/auth/agents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newAgent)
            });
            const data = await res.json();
            if (res.ok) {
                setAgents([...agents, data]);
                setNewAgent({ username: '', password: '', name: '' });
            } else {
                setError(data.error || 'Failed to create agent');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <Link to="/dashboard" className="flex items-center text-slate-400 hover:text-white mb-6 transition">
                    <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                </Link>

                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <Shield className="text-primary-500" /> Agent Management
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* List Agents */}
                    <div className="bg-dark-800 rounded-2xl p-6 border border-white/5">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Users size={20} className="text-blue-400" /> Existing Agents
                        </h2>
                        {loading ? (
                            <p className="text-slate-500">Loading...</p>
                        ) : (
                            <div className="space-y-3">
                                {agents.map(agent => (
                                    <Link key={agent._id || agent.id} to={`/admin/agents/${agent._id || agent.id}`} className="block">
                                        <div className="p-4 bg-dark-900 rounded-xl border border-white/5 flex justify-between items-center hover:bg-dark-950 transition cursor-pointer group">
                                            <div>
                                                <p className="font-bold text-white group-hover:text-primary-500 transition">{agent.name}</p>
                                                <p className="text-sm text-slate-500">@{agent.username}</p>
                                            </div>
                                            <div className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                                                Active
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {agents.length === 0 && <p className="text-slate-500 italic">No agents found.</p>}
                            </div>
                        )}
                    </div>

                    {/* Add Agent Form */}
                    <div className="bg-dark-800 rounded-2xl p-6 border border-white/5 h-fit">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <UserPlus size={20} className="text-emerald-400" /> Add New Agent
                        </h2>
                        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}
                        <form onSubmit={handleAddAgent} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    placeholder="e.g. John Doe"
                                    value={newAgent.name}
                                    onChange={e => setNewAgent({ ...newAgent, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    placeholder="e.g. johndoe"
                                    value={newAgent.username}
                                    onChange={e => setNewAgent({ ...newAgent, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    placeholder="••••••••"
                                    minLength={6}
                                    value={newAgent.password}
                                    onChange={e => setNewAgent({ ...newAgent, password: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary-500/25 mt-4"
                            >
                                Create Account
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAgents;
