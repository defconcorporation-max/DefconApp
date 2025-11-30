import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Image, Trash2, Pencil } from 'lucide-react';

import API_URL from '../config';

const Catalog = () => {
    const [activities, setActivities] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image_url: '',
        duration: '',
        address: '',
        included_in_pass: false,
        cost: ''
    });
    const [file, setFile] = useState(null);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const res = await fetch('${API_URL}/api/activities');
            if (res.ok) {
                const data = await res.json();
                setActivities(data);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    const handleFileUpload = async () => {
        if (!file) return null;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('${API_URL}/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            return data.url;
        } catch (error) {
            console.error('Error uploading file:', error);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let imageUrl = formData.image_url;
        if (file) {
            const uploadedUrl = await handleFileUpload();
            if (uploadedUrl) imageUrl = uploadedUrl;
        }

        const url = editingId
            ? `${API_URL}/api/activities/${editingId}`
            : '${API_URL}/api/activities';

        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, image_url: imageUrl })
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ title: '', description: '', image_url: '', duration: '', address: '', included_in_pass: false, cost: '' });
                setFile(null);
                setEditingId(null);
                fetchActivities();
            }
        } catch (error) {
            console.error('Error saving activity:', error);
        }
    };

    const handleEdit = (activity) => {
        setFormData({
            title: activity.title || '',
            description: activity.description || '',
            image_url: activity.image_url || '',
            duration: activity.duration || '',
            address: activity.address || '',
            included_in_pass: !!activity.included_in_pass,
            cost: activity.cost || ''
        });
        setEditingId(activity.id);
        setShowModal(true);
    };

    const openAddModal = () => {
        setFormData({ title: '', description: '', image_url: '', duration: '', address: '', included_in_pass: false, cost: '' });
        setFile(null);
        setEditingId(null);
        setShowModal(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition">
                            <ArrowLeft size={24} className="text-slate-600" />
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900">Activity Catalog</h1>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add New Activity
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activities.map(activity => (
                        <div key={activity.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group relative">
                            <div className="h-48 bg-slate-100 relative">
                                {activity.image_url ? (
                                    <img src={activity.image_url} alt={activity.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-300">
                                        <Image size={48} />
                                    </div>
                                )}
                                {activity.included_in_pass && (
                                    <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                        INCLUDED IN PASS
                                    </div>
                                )}
                                {activity.cost && (
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                                        ${activity.cost}
                                    </div>
                                )}
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                                <button
                                    onClick={() => handleEdit(activity)}
                                    className="p-2 bg-white/90 text-slate-700 rounded-full hover:text-primary-600 shadow-sm"
                                >
                                    <Pencil size={16} />
                                </button>
                            </div>
                            <div className="p-4 flex-1">
                                <h3 className="font-bold text-lg text-slate-900 mb-1">{activity.title}</h3>
                                <div className="flex flex-wrap gap-2 mb-2 text-xs text-slate-500">
                                    {activity.duration && (
                                        <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                                            ⏱ {activity.duration}m
                                        </span>
                                    )}
                                    {activity.address && (
                                        <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 truncate max-w-[150px]">
                                            📍 {activity.address}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-3">{activity.description}</p>
                            </div>
                        </div>
                    ))}
                    {activities.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-500">No activities in the catalog yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto text-slate-900">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Activity' : 'Add Catalog Item'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cost ($)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.cost}
                                        onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg h-24"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Thumbnail Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setFile(e.target.files[0])}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="included_in_pass"
                                    checked={formData.included_in_pass}
                                    onChange={e => setFormData({ ...formData, included_in_pass: e.target.checked })}
                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                <label htmlFor="included_in_pass" className="text-sm font-medium text-slate-700">Included in Viva Vegas Pass</label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    Save to Catalog
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalog;
