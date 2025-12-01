import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Heart, Plus, Check } from 'lucide-react';
import { motion } from 'framer-motion';

import API_URL from '../config';

const CatalogView = ({ client, onUpdateClient }) => {
    const { t } = useTranslation();
    const [activities, setActivities] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [wishlist, setWishlist] = useState(client.wishlist || []);

    useEffect(() => {
        fetch(`${API_URL}/api/activities`)
            .then(res => res.json())
            .then(data => setActivities(data))
            .catch(err => console.error("Failed to fetch activities", err));
    }, []);

    const toggleWishlist = async (activity) => {
        let newWishlist;
        if (wishlist.some(item => item.id === activity.id)) {
            newWishlist = wishlist.filter(item => item.id !== activity.id);
        } else {
            newWishlist = [...wishlist, activity];
        }

        setWishlist(newWishlist);

        // Optimistic update locally, then sync with server
        try {
            const res = await fetch(`${API_URL}/api/clients/${client.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...client, wishlist: newWishlist })
            });

            if (res.ok) {
                const updatedClient = await res.json();
                onUpdateClient(updatedClient);
            }
        } catch (err) {
            console.error("Failed to update wishlist", err);
            // Revert on error if needed
        }
    };

    const filteredActivities = activities.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.description && activity.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const [selectedActivity, setSelectedActivity] = useState(null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder={t('common.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActivities.map(activity => {
                    const isInWishlist = wishlist.some(item => item.id === activity.id);

                    return (
                        <div
                            key={activity.id}
                            className="bg-dark-800/40 rounded-xl border border-white/5 overflow-hidden flex flex-col hover:border-white/10 transition group cursor-pointer"
                            onClick={() => setSelectedActivity(activity)}
                        >
                            <div className="aspect-video bg-dark-900 relative">
                                {activity.image_url ? (
                                    <img src={activity.image_url.startsWith('http') ? activity.image_url : `${API_URL}/${activity.image_url.replace(/^\//, '')}`} alt={activity.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                        <Heart size={32} />
                                    </div>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleWishlist(activity);
                                    }}
                                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition ${isInWishlist ? 'bg-primary-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                                >
                                    {isInWishlist ? <Check size={16} /> : <Plus size={16} />}
                                </button>
                                {activity.included_in_pass && (
                                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wider rounded backdrop-blur-sm">
                                        {t('catalog.includedInPass')}
                                    </div>
                                )}
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-white text-lg mb-1">{activity.title}</h3>
                                <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1">{activity.description}</p>

                                <div className="flex justify-between items-center text-xs text-slate-500">
                                    {activity.duration && <span>{t('catalog.duration')}: {activity.duration} min</span>}
                                    {activity.cost && <span>${activity.cost}</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Activity Details Modal */}
            {selectedActivity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedActivity(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-dark-900 rounded-2xl max-w-2xl w-full overflow-hidden border border-white/10 shadow-2xl relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedActivity(null)}
                            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 z-10"
                        >
                            <Plus size={24} className="transform rotate-45" />
                        </button>

                        <div className="h-64 w-full relative bg-dark-800">
                            {selectedActivity.image_url ? (
                                <img src={selectedActivity.image_url.startsWith('http') ? selectedActivity.image_url : `${API_URL}/${selectedActivity.image_url.replace(/^\//, '')}`} alt={selectedActivity.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-700">
                                    <Heart size={48} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <h2 className="text-3xl font-bold text-white mb-2">{selectedActivity.title}</h2>
                                <div className="flex flex-wrap gap-3">
                                    {selectedActivity.included_in_pass && (
                                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded border border-emerald-500/20">
                                            {t('catalog.includedInPass')}
                                        </span>
                                    )}
                                    {selectedActivity.duration && (
                                        <span className="px-2 py-1 bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded">
                                            {selectedActivity.duration} min
                                        </span>
                                    )}
                                    {selectedActivity.cost && (
                                        <span className="px-2 py-1 bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded">
                                            ${selectedActivity.cost}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    {selectedActivity.description || "No description available."}
                                </p>
                            </div>

                            {selectedActivity.address && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Location</h3>
                                    <p className="text-white">{selectedActivity.address}</p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/10 flex justify-end">
                                <button
                                    onClick={() => {
                                        toggleWishlist(selectedActivity);
                                        setSelectedActivity(null);
                                    }}
                                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition ${wishlist.some(item => item.id === selectedActivity.id)
                                        ? 'bg-dark-800 text-white hover:bg-dark-700'
                                        : 'bg-primary-600 text-white hover:bg-primary-500'
                                        }`}
                                >
                                    {wishlist.some(item => item.id === selectedActivity.id) ? (
                                        <>
                                            <Check size={20} /> In Wishlist
                                        </>
                                    ) : (
                                        <>
                                            <Heart size={20} /> Add to Wishlist
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default CatalogView;
