import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plane, Hotel, Calendar, Plus, Trash2, Upload, Pencil, Download, MapPin, Clock, FileText, ExternalLink, Image, Heart, Ticket } from 'lucide-react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(BigCalendar);

import API_URL from '../config';

const ClientDetails = () => {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [itinerary, setItinerary] = useState([]);
    const [activities, setActivities] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeTab, setActiveTab] = useState('flight');
    const [editingItem, setEditingItem] = useState(null);
    const [wizardStep, setWizardStep] = useState(1); // 1: Flights, 2: Hotel, 3: Activities
    const [showEditClientModal, setShowEditClientModal] = useState(false);

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.includes('cloudinary.com')) return url;

        let cleanUrl = url;
        if (url.includes('localhost:3000')) {
            cleanUrl = url.replace('http://localhost:3000', '').replace('localhost:3000', '');
        }

        if (cleanUrl.startsWith('http')) return cleanUrl;
        return `${API_URL}/${cleanUrl.replace(/^\//, '')}`;
    };

    // Form State
    const [formData, setFormData] = useState({
        type: 'flight',
        title: '',
        start_time: '',
        end_time: '',
        location: '',
        description: '',
        image_url: '',
        cost: '',
        duration: '60',
        flight_number: '',
        pass_url: '',
        included_in_pass: false
    });
    const [file, setFile] = useState(null);
    const [passFile, setPassFile] = useState(null);
    const [travelerPassFiles, setTravelerPassFiles] = useState({});

    useEffect(() => {
        fetchClient();
        fetchItinerary();
        fetchActivities();
    }, [id]);

    const fetchClient = async () => {
        try {
            const res = await fetch(`${API_URL}/api/clients/${id}`);
            if (res.ok) {
                const data = await res.json();
                setClient(data);
            }
        } catch (error) {
            console.error('Error fetching client:', error);
        }
    };

    const fetchItinerary = async () => {
        try {
            const res = await fetch(`${API_URL}/api/itinerary/${id}`);
            if (res.ok) {
                const data = await res.json();
                setItinerary(data);
            }
        } catch (error) {
            console.error('Error fetching itinerary:', error);
        }
    };

    const fetchActivities = async () => {
        try {
            const res = await fetch(`${API_URL}/api/activities`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data);
            }
        } catch (error) {
            console.error("Failed to fetch activities", error);
        }
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                return data.url;
            }
            throw new Error('Upload failed');
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload file");
            return null;
        }
    };

    const handleFlightLookup = () => {
        const flightNum = formData.flight_number;
        if (!flightNum) return;

        // Mock flight data lookup
        // In a real app, this would call an API
        // Calculate arrival time based on a mock duration (e.g., 4h 30m)
        const durationMinutes = 270; // 4h 30m
        const startTime = formData.start_time ? moment(formData.start_time) : moment().add(1, 'days').set({ hour: 10, minute: 0 });
        const endTime = moment(startTime).add(durationMinutes, 'minutes');

        const mockFlightData = {
            title: `Flight ${flightNum.toUpperCase()} to Las Vegas`,
            location: 'Las Vegas (LAS)',
            start_time: startTime.format('YYYY-MM-DDTHH:mm'),
            end_time: endTime.format('YYYY-MM-DDTHH:mm'),
            description: 'Direct flight. Terminal 1. Duration: 4h 30m.',
            cost: '450.00',
            duration: durationMinutes.toString()
        };

        setFormData(prev => ({
            ...prev,
            ...mockFlightData
        }));
    };

    // Auto-calculate end time
    const handleSubmit = async (e) => {
        e.preventDefault();

        let uploadedImageUrl = formData.image_url;
        let uploadedPassUrl = formData.pass_url;

        // Upload Banner Image
        if (file) {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            try {
                const res = await fetch(`${API_URL}/api/upload`, {
                    method: 'POST',
                    body: uploadFormData
                });
                if (res.ok) {
                    const data = await res.json();
                    uploadedImageUrl = data.url;
                } else {
                    alert('Failed to upload image');
                    return;
                }
            } catch (error) {
                console.error("Failed to upload image", error);
                alert("Failed to upload image");
                return;
            }
        }

        // Upload Pass Document
        if (passFile) {
            const uploadFormData = new FormData();
            uploadFormData.append('file', passFile);
            try {
                const res = await fetch(`${API_URL}/api/upload`, {
                    method: 'POST',
                    body: uploadFormData
                });
                if (res.ok) {
                    const data = await res.json();
                    uploadedPassUrl = data.url;
                } else {
                    alert('Failed to upload document');
                    return;
                }
            } catch (error) {
                console.error("Failed to upload document", error);
                alert("Failed to upload document");
                return;
            }
        }

        // Upload Traveler Passes
        let finalTravelerPasses = formData.traveler_passes || [];

        if (client && client.travelers) {
            const newTravelerPasses = await Promise.all(client.travelers.map(async (traveler, idx) => {
                let passUrl = finalTravelerPasses.find(p => p.name === traveler.name)?.pass_url || '';

                if (travelerPassFiles[idx]) {
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', travelerPassFiles[idx]);
                    try {
                        const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: uploadFormData });
                        if (res.ok) {
                            const data = await res.json();
                            passUrl = data.url;
                        }
                    } catch (e) {
                        console.error("Failed to upload traveler pass", e);
                    }
                }

                return { name: traveler.name, pass_url: passUrl };
            }));
            finalTravelerPasses = newTravelerPasses;
        }

        // Auto-calculate end time
        let finalEndTime = formData.end_time;

        if (activeTab === 'activity' && formData.start_time && formData.duration) {
            finalEndTime = moment(formData.start_time).add(parseInt(formData.duration), 'minutes').format('YYYY-MM-DDTHH:mm');
        } else if ((formData.type === 'flight' || formData.type === 'hotel') && !finalEndTime && formData.start_time) {
            const start = new Date(formData.start_time);
            start.setHours(start.getHours() + 1);
            // Keep strictly local string for finalEndTime variable
            finalEndTime = moment(start).format('YYYY-MM-DDTHH:mm');
        }

        const method = editingItem ? 'PUT' : 'POST';
        const url = editingItem
            ? `${API_URL}/api/itinerary/${editingItem.id}`
            : `${API_URL}/api/itinerary`;

        const body = {
            ...formData,
            client_id: id,
            image_url: uploadedImageUrl,
            pass_url: uploadedPassUrl,
            included_in_pass: formData.included_in_pass,
            traveler_passes: finalTravelerPasses,
            is_flexible: formData.is_flexible,
            type: activeTab,
            start_time: formData.start_time ? new Date(formData.start_time).toISOString() : null,
            end_time: finalEndTime ? new Date(finalEndTime).toISOString() : null
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                fetchItinerary();
                closeModal();
            }
        } catch (error) {
            console.error("Failed to save item", error);
        }
    };

    const handleDelete = async (itemId) => {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await fetch(`${API_URL}/api/itinerary/${itemId}`, { method: 'DELETE' });
                fetchItinerary();
            } catch (error) {
                console.error("Failed to delete item", error);
            }
        }
    };

    const openModal = (type, item = null) => {
        setActiveTab(type);
        if (item) {
            setEditingItem(item);

            // Calculate duration in minutes for editing
            let duration = '60';
            if (item.start_time && item.end_time) {
                const start = new Date(item.start_time);
                const end = new Date(item.end_time);
                const diff = (end - start) / (1000 * 60); // minutes
                duration = diff > 0 ? diff.toString() : '60';
            }

            setFormData({
                type: item.type,
                title: item.title,
                start_time: item.start_time ? moment(item.start_time).format('YYYY-MM-DDTHH:mm') : '',
                end_time: item.end_time ? moment(item.end_time).format('YYYY-MM-DDTHH:mm') : '',
                location: item.location || '',
                description: item.description || '',
                image_url: item.image_url || '',
                cost: item.cost || '',
                duration: duration,
                flight_number: item.flight_number || '',
                pass_url: item.pass_url || '',
                included_in_pass: item.included_in_pass || false,
                is_flexible: item.is_flexible || false,
                traveler_passes: item.traveler_passes || []
            });
            setFile(null);
            setPassFile(null);
            setTravelerPassFiles({});
        } else {
            setEditingItem(null);
            setFormData({
                type: type,
                title: '',
                start_time: '',
                end_time: '',
                location: '',
                description: '',
                image_url: '',
                cost: '',
                duration: '60',
                flight_number: '',
                pass_url: '',
                included_in_pass: false,
                is_flexible: false,
                traveler_passes: []
            });
            setFile(null);
            setPassFile(null);
            setTravelerPassFiles({});
        }
        setShowAddModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingItem(null);
        setFile(null);
        setPassFile(null);
        setTravelerPassFiles({});
    };

    const handleUpdateClient = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/clients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(client)
            });
            if (res.ok) {
                const updatedClient = await res.json();
                setClient(updatedClient);
                setShowEditClientModal(false);
            }
        } catch (error) {
            console.error('Error updating client:', error);
        }
    };

    const handleExportPDF = async () => {
        const element = document.getElementById('itinerary-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#111111', // Match dark theme
                useCORS: true
            });
            const data = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProperties = pdf.getImageProperties(data);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;

            pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Itinerary_${client.name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to export PDF. Please try again.');
        }
    };

    const onEventDrop = async ({ event, start, end }) => {
        const updatedEvent = { ...event.resource, start_time: start, end_time: end };

        // Optimistic UI update
        const nextEvents = itinerary.map(existingEvent => {
            return existingEvent.id === event.id
                ? { ...existingEvent, start_time: start, end_time: end }
                : existingEvent;
        });
        setItinerary(nextEvents);

        try {
            const res = await fetch(`${API_URL}/api/itinerary/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...updatedEvent,
                    client_id: id // Ensure client_id is preserved
                })
            });

            if (!res.ok) {
                throw new Error('Failed to update event');
            }
            // Optionally refetch to ensure sync
            // fetchItinerary(); 
        } catch (error) {
            console.error("Failed to move event", error);
            // Revert on failure
            fetchItinerary();
        }
    };

    // Custom Calendar Components
    const CustomToolbar = (toolbar) => {
        const goToBack = () => {
            toolbar.onNavigate('PREV');
        };
        const goToNext = () => {
            toolbar.onNavigate('NEXT');
        };
        const goToCurrent = () => {
            toolbar.onNavigate('TODAY');
        };

        const label = () => {
            const date = moment(toolbar.date);
            return (
                <span className="text-lg font-bold text-white capitalize">
                    {date.format('MMMM YYYY')}
                </span>
            );
        };

        return (
            <div className="flex justify-between items-center mb-4 p-2">
                <div className="flex gap-2">
                    <button onClick={goToBack} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition">
                        <ArrowLeft size={18} />
                    </button>
                    <button onClick={goToCurrent} className="px-3 py-1 text-sm font-medium text-slate-400 hover:text-white transition">
                        Today
                    </button>
                    <button onClick={goToNext} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition transform rotate-180">
                        <ArrowLeft size={18} />
                    </button>
                </div>
                <div>{label()}</div>
                <div className="flex bg-dark-800 rounded-lg p-1 border border-white/5">
                    {['month', 'week', 'day'].map(view => (
                        <button
                            key={view}
                            onClick={() => toolbar.onView(view)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition capitalize ${toolbar.view === view ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {view}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const CustomEvent = ({ event }) => {
        const type = event.resource.type;
        let icon = <Calendar size={10} className="mr-1" />;
        let bgColor = 'bg-primary-600';
        let borderColor = 'border-primary-400';

        if (type === 'flight') {
            icon = <Plane size={10} className="mr-1" />;
            bgColor = 'bg-blue-600';
            borderColor = 'border-blue-400';
        } else if (type === 'hotel') {
            icon = <Hotel size={10} className="mr-1" />;
            bgColor = 'bg-purple-600';
            borderColor = 'border-purple-400';
        }

        return (
            <div className={`h-full w-full p-1 rounded-sm border-l-2 ${borderColor} ${bgColor} text-white hover:brightness-110 transition overflow-hidden shadow-sm`}>
                <div className="flex items-center text-[10px] font-bold leading-tight mb-0.5">
                    {icon}
                    <span className="truncate">{event.title}</span>
                </div>
                <div className="text-[9px] opacity-80 truncate font-mono">
                    {moment(event.start).format('HH:mm')}
                </div>
            </div>
        );
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    };

    // Calendar Events
    // Calendar Events
    const events = itinerary
        .filter(item => item.type !== 'hotel') // Optional: Hide hotels from calendar if desired, or keep them
        .map(item => {
            let start;
            let end;

            // Use moment for more robust parsing
            const mStart = moment(item.start_time);

            if (!mStart.isValid()) return null;

            start = mStart.toDate();

            if (item.type === 'flight') {
                // Force 1 hour for flights
                end = moment(start).add(1, 'hours').toDate();
            } else if (item.end_time) {
                let mEnd = moment(item.end_time);

                if (mEnd.isValid()) {
                    // Smart Repair: If end is before start, try to fix it based on time
                    if (mEnd.isBefore(mStart)) {
                        // Create a new end date using start date but end time
                        const repairedEnd = moment(start).set({
                            hour: mEnd.hour(),
                            minute: mEnd.minute(),
                            second: mEnd.second()
                        });

                        // If repaired end is still before start (e.g. ends next day early morning), add 1 day
                        if (repairedEnd.isBefore(mStart)) {
                            repairedEnd.add(1, 'day');
                        }

                        end = repairedEnd.toDate();
                    } else {
                        end = mEnd.toDate();
                    }

                    // Final check: if still invalid or same time, default to 1 hour
                    if (end <= start) {
                        end = moment(start).add(1, 'hours').toDate();
                    }
                } else {
                    end = moment(start).add(1, 'hours').toDate();
                }
            } else {
                end = moment(start).add(1, 'hours').toDate();
            }

            return {
                id: item.id,
                title: item.title,
                start,
                end,
                resource: item,
                type: item.type
            };
        })
        .filter(Boolean);

    if (!client) return <div className="text-white p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-dark-900 text-white font-sans">
            {/* Header */}
            <header className="bg-dark-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="p-2 hover:bg-white/5 rounded-full transition">
                            <ArrowLeft size={20} className="text-slate-400" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-white tracking-tight">{client.name}</h1>
                                <button onClick={() => setShowEditClientModal(true)} className="text-slate-500 hover:text-primary-500 transition">
                                    <Pencil size={14} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-medium">
                                <span>Ref: {client.booking_ref}</span>
                                {client.trip_start && (
                                    <>
                                        <span>•</span>
                                        <span>{new Date(client.trip_start).toLocaleDateString()} - {new Date(client.trip_end).toLocaleDateString()}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCopyLink}
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition"
                            title="Copy Link"
                        >
                            <ExternalLink size={18} />
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-white/10 text-slate-300 rounded-lg hover:bg-dark-700 transition text-sm font-medium"
                        >
                            <Download size={16} />
                            Export PDF
                        </button>
                        <div className="h-6 w-px bg-white/10 mx-2"></div>
                        <div className="flex bg-dark-800 rounded-lg p-1 border border-white/5">
                            <button
                                onClick={() => openModal('flight')}
                                className="p-2 hover:bg-white/5 rounded-md text-slate-400 hover:text-primary-500 transition"
                                title="Add Flight"
                            >
                                <Plane size={18} />
                            </button>
                            <button
                                onClick={() => openModal('hotel')}
                                className="p-2 hover:bg-white/5 rounded-md text-slate-400 hover:text-primary-500 transition"
                                title="Add Hotel"
                            >
                                <Hotel size={18} />
                            </button>
                            <button
                                onClick={() => openModal('activity')}
                                className="p-2 hover:bg-white/5 rounded-md text-slate-400 hover:text-primary-500 transition"
                                title="Add Activity"
                            >
                                <Calendar size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Wizard Progress */}
                <div className="mb-8 flex justify-center">
                    <div className="bg-dark-800/50 backdrop-blur-sm rounded-full p-1 flex items-center gap-1 border border-white/5">
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${wizardStep >= 1 ? 'bg-primary-500/10 text-primary-500' : 'text-slate-500'}`}>
                            <Plane size={14} /> Flights
                        </div>
                        <div className="w-4 h-px bg-white/10"></div>
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${wizardStep >= 2 ? 'bg-primary-500/10 text-primary-500' : 'text-slate-500'}`}>
                            <Hotel size={14} /> Hotels
                        </div>
                        <div className="w-4 h-px bg-white/10"></div>
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${wizardStep >= 3 ? 'bg-primary-500/10 text-primary-500' : 'text-slate-500'}`}>
                            <Calendar size={14} /> Activities
                        </div>
                    </div>
                </div>

                {/* Client Wishlist */}
                {client.wishlist && client.wishlist.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                            <Heart size={18} className="text-pink-500 fill-pink-500" />
                            Client Wishlist
                            <span className="bg-pink-500/10 text-pink-500 text-xs px-2 py-0.5 rounded-full border border-pink-500/20">
                                {client.wishlist.length} items
                            </span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {client.wishlist.map((item, index) => (
                                <div key={index} className="bg-dark-800/40 border border-pink-500/20 rounded-xl p-4 flex gap-4 group hover:bg-dark-800/60 transition">
                                    <div className="w-16 h-16 rounded-lg bg-dark-900 overflow-hidden shrink-0">
                                        {item.image_url ? (
                                            <img src={getImageUrl(item.image_url)} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-pink-500/20">
                                                <Heart size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium truncate">{item.title}</h3>
                                        <p className="text-slate-400 text-xs line-clamp-1 mb-2">{item.description}</p>
                                        <button
                                            onClick={() => {
                                                setActiveTab('activity');
                                                setEditingItem(null);
                                                setFormData({
                                                    type: 'activity',
                                                    title: item.title,
                                                    description: item.description,
                                                    image_url: item.image_url,
                                                    duration: item.duration || '60',
                                                    location: item.address || '',
                                                    start_time: '',
                                                    end_time: '',
                                                    cost: item.cost || '',
                                                    flight_number: '',
                                                    pass_url: ''
                                                });
                                                setShowAddModal(true);
                                            }}
                                            className="text-xs bg-primary-500 hover:bg-primary-400 text-white px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1"
                                        >
                                            <Plus size={12} /> Book This
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Trip Highlights (Flights & Hotels) */}
                        {(itinerary.some(i => i.type === 'flight') || itinerary.some(i => i.type === 'hotel')) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
                                    Trip Highlights
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {itinerary.filter(i => i.type === 'flight' || i.type === 'hotel')
                                        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                                        .map(item => (
                                            <motion.div
                                                key={item.id}
                                                whileHover={{ scale: 1.02 }}
                                                className={`relative overflow-hidden rounded-xl p-5 border border-white/5 ${item.type === 'flight' ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'bg-purple-500/10 hover:bg-purple-500/20'
                                                    } transition group`}
                                            >
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                                    <button onClick={() => openModal(item.type, item)} className="p-1.5 bg-dark-900/50 text-slate-300 rounded hover:text-white backdrop-blur-sm">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-dark-900/50 text-red-400 rounded hover:text-red-300 backdrop-blur-sm">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-lg ${item.type === 'flight' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                                                        } shadow-lg`}>
                                                        {item.type === 'flight' ? <Plane size={20} /> : <Hotel size={20} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="text-lg font-bold text-white truncate pr-8">{item.title}</h3>
                                                        </div>
                                                        <div className="flex flex-col gap-1 mt-2 text-sm text-slate-300">
                                                            <span className="flex items-center gap-2">
                                                                <Clock size={14} className="text-slate-500" />
                                                                {new Date(item.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {item.location && (
                                                                <span className="flex items-center gap-2">
                                                                    <MapPin size={14} className="text-slate-500" />
                                                                    {item.location}
                                                                </span>
                                                            )}
                                                            {item.cost > 0 && (
                                                                <span className="flex items-center gap-2 text-emerald-400 font-medium">
                                                                    <span className="text-slate-500">$</span>{item.cost}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {item.description && (
                                                    <div className="mt-4 pt-4 border-t border-white/5">
                                                        <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Itinerary List (Activities Only) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                            id="itinerary-content"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                                    Daily Activities
                                </h2>
                            </div>

                            {itinerary.filter(i => i.type !== 'flight' && i.type !== 'hotel').length === 0 ? (
                                <div className="text-center py-12 bg-dark-800/30 rounded-xl border border-dashed border-white/10">
                                    <p className="text-slate-500">No activities added yet.</p>
                                    <button onClick={() => openModal('activity')} className="mt-4 text-primary-500 hover:text-primary-400 text-sm font-medium">
                                        + Add Activity
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {itinerary.filter(i => i.type !== 'flight' && i.type !== 'hotel')
                                        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                                        .map((item) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="bg-dark-800/40 rounded-xl p-5 border border-transparent hover:border-white/5 hover:bg-dark-800/60 transition group relative"
                                            >
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                                    <button onClick={() => openModal(item.type, item)} className="p-1.5 bg-dark-700 text-slate-300 rounded hover:text-white">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-dark-700 text-red-400 rounded hover:text-red-300">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary-500/10 text-primary-500">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                                                                <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock size={14} />
                                                                        {new Date(item.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                    {item.location && (
                                                                        <span className="flex items-center gap-1">
                                                                            <MapPin size={14} />
                                                                            {item.location}
                                                                        </span>
                                                                    )}
                                                                    {item.cost > 0 && (
                                                                        <span className="flex items-center gap-1 text-emerald-400">
                                                                            ${item.cost}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {item.description && (
                                                            <p className="text-slate-400 text-sm mt-3 leading-relaxed border-l-2 border-white/5 pl-3">
                                                                {item.description}
                                                            </p>
                                                        )}

                                                        {item.image_url && (
                                                            <div className="mt-4">
                                                                <img
                                                                    src={getImageUrl(item.image_url)}
                                                                    alt="Attachment"
                                                                    className="h-24 rounded-lg border border-white/5 object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Calendar View */}
                    <div className="lg:col-span-1">
                        <div className="bg-dark-800/40 rounded-xl p-4 border border-white/5 sticky top-24">
                            <div className="h-[600px] text-xs">
                                <DnDCalendar
                                    localizer={localizer}
                                    events={events}
                                    startAccessor="start"
                                    endAccessor="end"
                                    views={['month', 'week', 'day']}
                                    defaultView="month"
                                    defaultDate={client.trip_start ? new Date(client.trip_start) : new Date()}
                                    selectable
                                    resizable={false}
                                    components={{
                                        toolbar: CustomToolbar,
                                        event: CustomEvent
                                    }}
                                    onEventDrop={onEventDrop}
                                    onSelectSlot={(slotInfo) => {
                                        setFormData({ ...formData, start_time: moment(slotInfo.start).format('YYYY-MM-DDTHH:mm') });
                                        openModal('activity');
                                    }}
                                    onSelectEvent={(event) => openModal(event.resource.type, event.resource)}
                                    className="rbc-calendar-premium"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add/Edit Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-dark-800 rounded-2xl max-w-2xl w-full p-8 border border-white/10 shadow-2xl my-8"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-white">{editingItem ? 'Edit Itinerary Item' : `Add ${activeTab === 'flight' ? 'Flight' : activeTab === 'hotel' ? 'Hotel' : 'Activity'}`}</h2>

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Catalog Selection for Activities */}
                            {activeTab === 'activity' && activities.length > 0 && (
                                <div className="bg-dark-900/50 p-4 rounded-lg border border-white/5 mb-4">
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Select from Catalog (Optional)</label>
                                    <select
                                        className="w-full px-3 py-2 bg-dark-800 border border-dark-600 text-white rounded-lg focus:ring-1 focus:ring-primary-500 outline-none"
                                        onChange={(e) => {
                                            const activity = activities.find(a => a.id === parseInt(e.target.value));
                                            if (activity) {
                                                setFormData({
                                                    ...formData,
                                                    title: activity.title,
                                                    description: activity.description,
                                                    image_url: activity.image_url
                                                });
                                            }
                                        }}
                                    >
                                        <option value="">-- Choose a pre-made activity --</option>
                                        {activities.map(act => (
                                            <option key={act.id} value={act.id}>{act.title}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={activeTab === 'flight' ? 'Flight to Paris' : activeTab === 'hotel' ? 'Ritz Carlton' : 'Louvre Museum'}
                                        className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg placeholder-slate-600 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Location</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg placeholder-slate-600 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            {activeTab === 'flight' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Flight Number <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. AA123"
                                            className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg placeholder-slate-600 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                            value={formData.flight_number}
                                            onChange={e => setFormData({ ...formData, flight_number: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleFlightLookup}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition whitespace-nowrap"
                                        >
                                            Fetch Info
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Cost ($)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg placeholder-slate-600 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    value={formData.cost || ''}
                                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                />
                                <div className="mt-3 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="included_in_pass"
                                        className="w-4 h-4 rounded border-dark-600 text-primary-500 focus:ring-primary-500 bg-dark-900"
                                        checked={formData.included_in_pass || false}
                                        onChange={e => setFormData({ ...formData, included_in_pass: e.target.checked })}
                                    />
                                    <label htmlFor="included_in_pass" className="text-sm text-slate-300 cursor-pointer select-none">
                                        Included in Unlimited Pass?
                                    </label>
                                </div>

                                {/* Individual Traveler Passes */}
                                {console.log('DEBUG: Client:', client)}
                                {console.log('DEBUG: Travelers:', client?.travelers)}
                                {client && client.travelers && client.travelers.length > 0 && (
                                    <div className="mt-6 border-t border-white/10 pt-4">
                                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <Ticket size={14} className="text-primary-500" />
                                            Individual Traveler Passes
                                        </h3>
                                        <p className="text-xs text-slate-500 mb-4">
                                            Upload specific tickets/passes for each traveler for this activity.
                                        </p>
                                        <div className="space-y-3">
                                            {client.travelers.map((traveler, idx) => (
                                                <div key={idx} className="bg-dark-900/50 p-3 rounded-lg border border-white/5">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium text-slate-300">{traveler.name}</span>
                                                        {formData.traveler_passes?.find(p => p.name === traveler.name)?.pass_url && (
                                                            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                                                                Pass Uploaded
                                                            </span>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        onChange={(e) => setTravelerPassFiles({ ...travelerPassFiles, [idx]: e.target.files[0] })}
                                                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-500/10 file:text-primary-500 hover:file:bg-primary-500/20 cursor-pointer"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                                        {activeTab === 'hotel' ? 'Check-in' : activeTab === 'flight' ? 'Departure Time' : 'Start Time'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg [color-scheme:dark] focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                    />
                                </div>

                                {(activeTab === 'hotel' || activeTab === 'flight') && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                                            {activeTab === 'hotel' ? 'Check-out' : 'Arrival Time'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg [color-scheme:dark] focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                            value={formData.end_time}
                                            onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        />
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Duration</label>
                                        <select
                                            className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                        >
                                            {[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 420, 480, 540, 600, 660, 720, 780, 840].map(mins => {
                                                const hours = Math.floor(mins / 60);
                                                const m = mins % 60;
                                                let label = '';
                                                if (hours > 0) label += `${hours}h`;
                                                if (m > 0) label += ` ${m}m`;
                                                return <option key={mins} value={mins}>{label.trim()}</option>;
                                            })}
                                        </select>
                                        <div className="mt-2 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="is_flexible"
                                                className="w-4 h-4 rounded border-dark-600 text-primary-500 focus:ring-primary-500 bg-dark-900"
                                                checked={formData.is_flexible || false}
                                                onChange={e => setFormData({ ...formData, is_flexible: e.target.checked })}
                                            />
                                            <label htmlFor="is_flexible" className="text-xs text-slate-400 cursor-pointer select-none uppercase tracking-wider">
                                                Flexible Start Time
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Description / Notes</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg h-24 placeholder-slate-600 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* File Uploads: Banner & Pass */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Banner Image */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Banner Image</label>
                                    <div className="border-2 border-dashed border-dark-700 hover:border-dark-600 rounded-xl p-6 text-center transition-colors bg-dark-900/30 h-full flex flex-col justify-center">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={e => setFile(e.target.files[0])}
                                            accept="image/*"
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                            <div className="p-3 bg-dark-800 rounded-full">
                                                <Image size={24} className="text-slate-400" />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-sm font-medium text-white block">
                                                    {file ? file.name : (formData.image_url ? 'Change Banner' : 'Upload Banner')}
                                                </span>
                                                <span className="text-xs text-slate-500 mt-1 block">Display image for the card</span>
                                            </div>
                                            {formData.image_url && !file && (
                                                <span className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded">Current banner attached</span>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                {/* Pass/Document */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Pass / Ticket / Document</label>
                                    <div className="border-2 border-dashed border-dark-700 hover:border-dark-600 rounded-xl p-6 text-center transition-colors bg-dark-900/30 h-full flex flex-col justify-center">
                                        <input
                                            type="file"
                                            id="pass-upload"
                                            className="hidden"
                                            onChange={e => setPassFile(e.target.files[0])}
                                            accept="image/*,application/pdf"
                                        />
                                        <label htmlFor="pass-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                            <div className="p-3 bg-dark-800 rounded-full">
                                                <FileText size={24} className="text-slate-400" />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-sm font-medium text-white block">
                                                    {passFile ? passFile.name : (formData.pass_url ? 'Change Document' : 'Upload Document')}
                                                </span>
                                                <span className="text-xs text-slate-500 mt-1 block">Ticket or Pass (Hidden until clicked)</span>
                                            </div>
                                            {formData.pass_url && !passFile && (
                                                <span className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded">Current doc attached</span>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-3 border border-dark-600 text-slate-300 rounded-lg hover:bg-dark-700 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium shadow-lg shadow-primary-500/20"
                                >
                                    {editingItem ? 'Save Changes' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Edit Client Profile Modal */}
            {showEditClientModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-dark-800 rounded-2xl max-w-md w-full p-8 border border-white/10 shadow-2xl"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-white">Edit Client Profile</h2>
                        <form onSubmit={handleUpdateClient} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    value={client.name}
                                    onChange={e => setClient({ ...client, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    value={client.email}
                                    onChange={e => setClient({ ...client, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    value={client.phone}
                                    onChange={e => setClient({ ...client, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Booking Reference</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    value={client.booking_ref}
                                    onChange={e => setClient({ ...client, booking_ref: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Trip Start</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 [color-scheme:dark] transition-all"
                                        value={client.trip_start ? moment.utc(client.trip_start).format('YYYY-MM-DD') : ''}
                                        onChange={e => setClient({ ...client, trip_start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Trip End</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 [color-scheme:dark] transition-all"
                                        value={client.trip_end ? moment.utc(client.trip_end).format('YYYY-MM-DD') : ''}
                                        onChange={e => setClient({ ...client, trip_end: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Unlimited Pass Section */}
                            <div className="border-t border-white/10 pt-4 mt-4">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Ticket size={16} className="text-primary-500" />
                                    Unlimited Passes & Travelers
                                </h3>

                                {/* Main Client Pass */}
                                <div className="mb-4 bg-dark-900/50 p-3 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-white">{client.name} (Main)</span>
                                        <label className="cursor-pointer text-xs text-primary-500 hover:text-primary-400 flex items-center gap-1">
                                            <Upload size={12} />
                                            {client.pass_url ? 'Change Pass' : 'Upload Pass'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    if (e.target.files[0]) {
                                                        const url = await uploadFile(e.target.files[0]);
                                                        if (url) setClient({ ...client, pass_url: url });
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    {client.pass_url && (
                                        <div className="text-xs text-emerald-500 flex items-center gap-1">
                                            <FileText size={10} /> Pass Uploaded
                                        </div>
                                    )}
                                </div>

                                {/* Additional Travelers */}
                                <div className="space-y-3">
                                    {client.travelers && client.travelers.map((traveler, idx) => (
                                        <div key={idx} className="bg-dark-900/50 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-white">{traveler.name}</div>
                                                {traveler.pass_url ? (
                                                    <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                                                        <FileText size={10} /> Pass Uploaded
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-slate-500 mt-1">No pass uploaded</div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="cursor-pointer p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-primary-500 transition">
                                                    <Upload size={14} />
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            if (e.target.files[0]) {
                                                                const url = await uploadFile(e.target.files[0]);
                                                                if (url) {
                                                                    const newTravelers = [...client.travelers];
                                                                    newTravelers[idx].pass_url = url;
                                                                    setClient({ ...client, travelers: newTravelers });
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newTravelers = client.travelers.filter((_, i) => i !== idx);
                                                        setClient({ ...client, travelers: newTravelers });
                                                    }}
                                                    className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-red-500 transition"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Traveler Input */}
                                <div className="mt-3 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add traveler name..."
                                        className="flex-1 px-3 py-2 bg-dark-900 border border-dark-700 text-white text-sm rounded-lg focus:ring-1 focus:ring-primary-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (e.target.value.trim()) {
                                                    const newTravelers = [...(client.travelers || []), { name: e.target.value.trim(), pass_url: '' }];
                                                    setClient({ ...client, travelers: newTravelers });
                                                    e.target.value = '';
                                                }
                                            }
                                        }}
                                        id="new-traveler-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('new-traveler-input');
                                            if (input.value.trim()) {
                                                const newTravelers = [...(client.travelers || []), { name: input.value.trim(), pass_url: '' }];
                                                setClient({ ...client, travelers: newTravelers });
                                                input.value = '';
                                            }
                                        }}
                                        className="px-3 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Notes</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 h-20 transition-all"
                                    value={client.notes || ''}
                                    onChange={e => setClient({ ...client, notes: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Preferences</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 h-20 transition-all"
                                    value={client.preferences || ''}
                                    onChange={e => setClient({ ...client, preferences: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowEditClientModal(false)}
                                    className="flex-1 px-4 py-3 border border-dark-600 text-slate-300 rounded-lg hover:bg-dark-700 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium shadow-lg shadow-primary-500/20"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ClientDetails;
