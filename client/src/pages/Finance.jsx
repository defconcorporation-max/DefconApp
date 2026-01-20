
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, Calendar, TrendingUp, Filter, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Finance = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'Other',
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: ''
    });

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (token && user?.role === 'admin') {
            fetchExpenses();
        }
    }, [token, user]);

    const fetchExpenses = async () => {
        try {
            const res = await fetch(`${API_URL}/api/expenses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error("Failed to fetch expenses", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({
                    title: '',
                    amount: '',
                    category: 'Other',
                    status: 'pending',
                    date: new Date().toISOString().split('T')[0],
                    due_date: '',
                    notes: ''
                });
                fetchExpenses();
            }
        } catch (error) {
            console.error("Error adding expense", error);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`${API_URL}/api/expenses/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchExpenses();
        } catch (error) {
            console.error("Error updating status", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`${API_URL}/api/expenses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchExpenses();
        } catch (error) {
            console.error("Error deleting expense", error);
        }
    };

    // Stats Calculations for Agency
    const totalPending = expenses.filter(e => e.status === 'pending').reduce((acc, e) => acc + e.amount, 0);
    const totalPaid = expenses.filter(e => e.status === 'paid').reduce((acc, e) => acc + e.amount, 0);

    const commissionPending = expenses.filter(e => e.category === 'Commission Payout' && e.status === 'pending').reduce((acc, e) => acc + e.amount, 0);
    const commissionPaid = expenses.filter(e => e.category === 'Commission Payout' && e.status === 'paid').reduce((acc, e) => acc + e.amount, 0);

    // Operational Expenses (Excluding Commissions)
    const operationalPending = totalPending - commissionPending;

    // Check overdue
    const now = new Date();
    const overdueCount = expenses.filter(e => e.status === 'pending' && e.due_date && new Date(e.due_date) < now).length;

    if (loading) return null;

    return (
        <div className="min-h-screen bg-dark-900 text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link to="/dashboard" className="flex items-center text-slate-400 hover:text-white mb-2 transition">
                            <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <DollarSign className="text-primary-500" /> Agency Accounting
                        </h1>
                        <p className="text-slate-500 mt-1">Manage all agency expenses and commission payouts.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary-500/20 flex items-center gap-2 transition transform hover:scale-105"
                    >
                        <Plus size={20} /> Add New Expense
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Unpaid Operations (Liabilities) */}
                    <div className="bg-dark-800/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-orange-500/30 transition">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                            <Clock size={80} />
                        </div>
                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Unpaid Expenses</h3>
                        <p className="text-3xl font-bold text-orange-400 flex items-center gap-2">
                            ${operationalPending.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                            Operational costs (software, rent, etc.)
                        </p>
                    </div>

                    {/* Unpaid Commissions (Focused) */}
                    <div className="bg-dark-800/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                            <DollarSign size={80} />
                        </div>
                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Unpaid Commissions</h3>
                        <p className="text-3xl font-bold text-indigo-400 flex items-center gap-2">
                            ${commissionPending.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                            Agent payouts waiting for payment
                        </p>
                    </div>

                    {/* Total Paid */}
                    <div className="bg-dark-800/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                            <CheckCircle size={80} />
                        </div>
                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Paid</h3>
                        <p className="text-3xl font-bold text-emerald-400 flex items-center gap-2">
                            ${totalPaid.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                            All settled expenses & commissions
                        </p>
                    </div>

                    {/* Overdue */}
                    <div className="bg-dark-800/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-red-500/30 transition">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                            <AlertCircle size={80} />
                        </div>
                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Overdue Invoices</h3>
                        <p className={`text-3xl font-bold flex items-center gap-2 ${overdueCount > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                            {overdueCount}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">Requires immediate attention</p>
                    </div>
                </div>

                {/* Expenses Table */}
                <div className="bg-dark-800 rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-xl font-bold">Recent Expenses</h2>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 text-xs bg-dark-700 hover:bg-dark-600 rounded-lg text-slate-300 transition">All</button>
                            <button className="px-3 py-1.5 text-xs bg-dark-900 border border-white/5 hover:border-orange-500/50 rounded-lg text-slate-300 transition">Pending</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-dark-900/50 text-xs uppercase text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Title / Description</th>
                                    <th className="px-6 py-4 font-semibold">Category</th>
                                    <th className="px-6 py-4 font-semibold">Amount</th>
                                    <th className="px-6 py-4 font-semibold">Due Date</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {expenses.map(expense => {
                                    const isOverdue = expense.status === 'pending' && expense.due_date && new Date(expense.due_date) < new Date();
                                    return (
                                        <tr key={expense._id} className="hover:bg-white/5 transition group">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-white">{expense.title}</div>
                                                {expense.notes && <div className="text-xs text-slate-500">{expense.notes}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-dark-700 rounded-md text-xs text-slate-300 border border-white/5">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-white">
                                                ${expense.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                {expense.due_date ? (
                                                    <span className={isOverdue ? "text-red-400 font-bold flex items-center gap-1" : ""}>
                                                        {isOverdue && <AlertCircle size={12} />}
                                                        {new Date(expense.due_date).toLocaleDateString()}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {expense.status === 'paid' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        <CheckCircle size={12} /> Paid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 cursor-pointer hover:bg-orange-500/20" onClick={() => updateStatus(expense._id, 'paid')}>
                                                        <Clock size={12} /> Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleDelete(expense._id)} className="text-slate-500 hover:text-red-400 transition">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {expenses.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                            No expenses recorded. Add one to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-dark-800 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl p-6"
                    >
                        <h2 className="text-2xl font-bold mb-6">Add New Expense</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description / Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary-500 outline-none"
                                    placeholder="e.g. Monthly Software Subscription"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Amount ($)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary-500 outline-none"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                                    <select
                                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary-500 outline-none"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Other">Other</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Software">Software</option>
                                        <option value="Travel">Travel</option>
                                        <option value="Commission Payout">Commission Payout</option>
                                        <option value="Office">Office</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary-500 outline-none"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary-500 outline-none"
                                        value={formData.due_date}
                                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="pending"
                                            checked={formData.status === 'pending'}
                                            onChange={() => setFormData({ ...formData, status: 'pending' })}
                                            className="accent-orange-500"
                                        />
                                        <span className="text-orange-400">Pending</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="paid"
                                            checked={formData.status === 'paid'}
                                            onChange={() => setFormData({ ...formData, status: 'paid' })}
                                            className="accent-emerald-500"
                                        />
                                        <span className="text-emerald-400">Paid</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes (Optional)</label>
                                <textarea
                                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-primary-500 outline-none"
                                    rows="2"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold bg-dark-700 hover:bg-dark-600 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl font-bold bg-primary-500 hover:bg-primary-600 transition text-white shadow-lg shadow-primary-500/20"
                                >
                                    Save Expense
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Finance;
