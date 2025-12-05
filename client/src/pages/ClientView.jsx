import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, MapPin, ArrowLeft, Ticket, Plane, Hotel, Grid, List, Download, Mail, ExternalLink, X, Info, Map as MapIcon, Cloud, Sun, Moon, Wind, Droplets, FileText } from 'lucide-react';
import { format, parseISO, startOfWeek, getDay } from 'date-fns';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import moment from 'moment';
import CatalogView from './CatalogView';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// Fix Leaflet default icon
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parseISO,
    startOfWeek,
    getDay,
    locales,
});



import API_URL from '../config';

const ClientView = () => {
    const { id } = useParams();
    const { t } = useTranslation();
    const [client, setClient] = useState(null);
    const [itinerary, setItinerary] = useState([]);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('timeline'); // timeline, flights, hotels, calendar, passes, map
    const [selectedPass, setSelectedPass] = useState(null); // For pass modal
    const [selectedEvent, setSelectedEvent] = useState(null); // For event detail modal

    const getImageUrl = (url) => {
        if (!url) return null;
        // If it's a Cloudinary URL, return as is
        if (url.includes('cloudinary.com')) return url;

        // If it's a localhost URL, strip the domain to make it relative
        let cleanUrl = url;
        if (url.includes('localhost:3000')) {
            cleanUrl = url.replace('http://localhost:3000', '').replace('localhost:3000', '');
        }

        // If it starts with http (and wasn't localhost), return as is
        if (cleanUrl.startsWith('http')) return cleanUrl;

        // Otherwise, prepend API_URL (ensure single slash)
        return `${API_URL}/${cleanUrl.replace(/^\//, '')}`;
    };

    const [showIntro, setShowIntro] = useState(true);
    const [calendarView, setCalendarView] = useState('week');
    const [darkMode, setDarkMode] = useState(true);

    useEffect(() => {
        // Check local storage or preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setDarkMode(savedTheme === 'dark');
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else {
            // Default to dark
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    useEffect(() => {
        fetchClientData();
    }, [id]);

    const fetchClientData = async () => {
        try {
            setError(null);
            const res = await fetch(`${API_URL}/api/clients/${id}`);
            if (res.ok) {
                const data = await res.json();
                setClient(data);
                setItinerary(data.itinerary || []);
            } else {
                setError('Client not found');
            }
        } catch (error) {
            console.error('Error fetching client data:', error);
            setError('Failed to load client data');
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-900 text-slate-900 dark:text-white transition-colors duration-300">
                <div className="p-8 bg-white dark:bg-dark-800 rounded-2xl shadow-xl text-center border border-slate-200 dark:border-white/5">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{t('error', 'Error')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                    <a href="/" className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition">
                        {t('goHome', 'Go Home')}
                    </a>
                </div>
            </div>
        );
    }

    const handleExportPDF = async () => {
        const element = document.getElementById('itinerary-content-export');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#111111', // Match dark theme
                useCORS: true,
                logging: false,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            const ratio = pdfWidth / imgWidth;
            const scaledHeight = imgHeight * ratio;

            let heightLeft = scaledHeight;
            let position = 0;

            // First page
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
            heightLeft -= pdfHeight;

            // Additional pages
            while (heightLeft > 0) {
                position = heightLeft - scaledHeight; // This positions the top of the image off-canvas upwards
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`Itinerary_${client.name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to export PDF. Please try again.');
        }
    };

    const handleContactAgent = () => {
        window.location.href = `mailto:agent@vivavegasquebec.com?subject=Question regarding trip: ${client.booking_ref}`;
    };

    if (!client) return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-dark-800 rounded-full mb-4 border border-white/5"></div>
                <div className="h-4 w-32 bg-dark-800 rounded border border-white/5"></div>
            </div>
        </div>
    );

    // Prepare events for Big Calendar
    const calendarEvents = itinerary
        .filter(item => item.type !== 'hotel') // Hide hotels from calendar
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

    const eventPropGetter = (event) => {
        const type = event.resource.type;
        let backgroundColor = '#f97316'; // Default/Activity: Primary-500 (Orange)

        if (type === 'flight') {
            backgroundColor = '#2563eb'; // Blue-600
        } else if (type === 'hotel') {
            backgroundColor = '#9333ea'; // Purple-600
        }

        return {
            style: {
                backgroundColor: backgroundColor,
                borderRadius: '6px',
                opacity: 1,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

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
                <span className="text-xl font-bold text-slate-900 dark:text-white capitalize tracking-tight">
                    {date.format('MMMM YYYY')}
                </span>
            );
        };

        return (
            <div className="flex justify-between items-center mb-6 p-4 bg-white dark:bg-dark-800/50 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none transition-colors duration-300">
                <div className="flex gap-2">
                    <button onClick={goToBack} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white transition">
                        <ArrowLeft size={20} />
                    </button>
                    <button onClick={goToCurrent} className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition uppercase tracking-wider">
                        Today
                    </button>
                    <button onClick={goToNext} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white transition transform rotate-180">
                        <ArrowLeft size={20} />
                    </button>
                </div>
                <div>{label()}</div>
                <div className="flex gap-2">
                    {/* View switcher could go here if needed */}
                </div>
            </div>
        );
    };

    const CustomEvent = ({ event }) => {
        const type = event.resource.type;
        let icon = <Ticket size={12} className="mr-1.5" />;
        let bgColor = 'bg-primary-500';
        let borderColor = 'border-primary-400';

        if (type === 'flight') {
            icon = <Plane size={12} className="mr-1.5" />;
            bgColor = 'bg-blue-600';
            borderColor = 'border-blue-400';
        } else if (type === 'hotel') {
            icon = <Hotel size={12} className="mr-1.5" />;
            bgColor = 'bg-purple-600';
            borderColor = 'border-purple-400';
        }

        return (
            <div className={`h-full w-full p-1.5 flex flex-col justify-start overflow-hidden ${bgColor} border-l-2 ${borderColor} shadow-sm hover:brightness-110 transition-all`}>
                <div className="text-[11px] font-bold text-white flex items-center mb-0.5 tracking-tight leading-tight">
                    {icon}
                    <span className="truncate">{event.title}</span>
                </div>
                <div className="text-[9px] text-white/80 font-medium truncate font-mono">
                    {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                </div>
            </div>
        );
    };

    // --- PREMIUM COMPONENTS ---

    const CountdownIntro = ({ targetDate }) => {
        const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

        useEffect(() => {
            const interval = setInterval(() => {
                const now = new Date().getTime();
                // Ensure targetDate is treated as local time of the destination if possible, or just standard date parsing
                // If targetDate is ISO string (UTC), new Date(targetDate) converts to local time of browser.
                // If we want to count down to a specific moment, this is generally correct.
                const distance = new Date(targetDate).getTime() - now;

                if (distance < 0) {
                    clearInterval(interval);
                } else {
                    setTimeLeft({
                        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                        seconds: Math.floor((distance % (1000 * 60)) / 1000)
                    });
                }
            }, 1000);
            return () => clearInterval(interval);
        }, [targetDate]);

        return (
            <div className="bg-white dark:bg-dark-950 border-b border-slate-200 dark:border-white/10 py-4 mb-8 transition-colors duration-300">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-xs font-light tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-2 uppercase">{t('clientView.intro.title')}</h2>
                    <div className="flex justify-center gap-4 md:gap-8 text-center">
                        {Object.entries(timeLeft).map(([unit, value]) => (
                            <div key={unit} className="flex flex-col items-center">
                                <div className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-500 font-mono">
                                    {String(value).padStart(2, '0')}
                                </div>
                                <div className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest mt-1">{unit}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const WeatherWidget = ({ tripStart, tripEnd }) => {
        const [weather, setWeather] = useState(null);
        const [isOpen, setIsOpen] = useState(true);
        const [status, setStatus] = useState('loading'); // loading, success, no_data, error

        useEffect(() => {
            if (!tripStart || !tripEnd) return;

            // Use UTC to avoid timezone shifting the start date back a day
            const start = moment.utc(tripStart);
            const now = moment();
            const daysUntilTrip = start.diff(now, 'days');

            // Open-Meteo provides 16 days forecast
            if (daysUntilTrip > 14) {
                setStatus('no_data');
                return;
            }

            // Format dates for API (YYYY-MM-DD)
            const startDate = moment(tripStart).format('YYYY-MM-DD');
            const endDate = moment(tripEnd).format('YYYY-MM-DD');

            setStatus('loading');
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=36.1699&longitude=-115.1398&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${startDate}&end_date=${endDate}`)
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        console.warn("Weather API error:", data);
                        setStatus('no_data');
                    } else {
                        setWeather(data);
                        setStatus('success');
                    }
                })
                .catch(err => {
                    console.error("Weather fetch failed", err);
                    setStatus('error');
                });
        }, [tripStart, tripEnd]);

        const getWeatherIcon = (code) => {
            if (code <= 3) return <Sun className="text-yellow-400" />;
            if (code <= 67) return <Droplets className="text-blue-400" />;
            return <Cloud className="text-slate-400" />;
        };

        return (
            <div className="bg-white dark:bg-dark-800/50 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden mb-8 shadow-sm dark:shadow-none transition-colors duration-300">
                <div
                    className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Cloud size={16} /> Destination Forecast
                    </h3>
                    <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-6 pt-0">
                                {status === 'loading' && <div className="text-center text-slate-500 py-4">Loading forecast...</div>}
                                {status === 'no_data' && (
                                    <div className="text-center py-8 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                                        <Cloud size={32} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-slate-500 dark:text-slate-400">
                                            {t('clientView.weather.noData', 'Pas de données disponibles pour le moment')}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">Forecast available 14 days before trip</p>
                                    </div>
                                )}
                                {status === 'success' && weather && weather.daily && (
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4 overflow-x-auto pb-2">
                                        {weather.daily.time.map((day, i) => (
                                            <div key={day} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 min-w-[80px]">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{moment(day).format('MMM D')}</p>
                                                <div className="flex justify-center mb-2">
                                                    {getWeatherIcon(weather.daily.weather_code[i])}
                                                </div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {Math.round(weather.daily.temperature_2m_max[i])}° <span className="text-slate-400 text-xs">{Math.round(weather.daily.temperature_2m_min[i])}°</span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const AddressLink = ({ location, className }) => {
        if (!location) return null;
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
        return (
            <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`hover:underline hover:text-primary-500 transition-colors flex items-center gap-1 ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {location} <ExternalLink size={10} className="inline opacity-50" />
            </a>
        );
    };

    const FlightCard = ({ flight }) => {
        const isFarFuture = moment(flight.start_time).diff(moment(), 'days') > 30;

        return (
            <div className="bg-white dark:bg-dark-800/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 mb-4 shadow-sm dark:shadow-none relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Plane size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{flight.title}</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Flight</p>
                        </div>
                    </div>
                    {flight.flight_number && !isFarFuture && (
                        <div className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                            {flight.flight_number}
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center text-sm">
                    <div>
                        <div className="text-slate-500 text-xs mb-1">Departure</div>
                        <div className="font-bold text-slate-900 dark:text-white">{moment(flight.start_time).format('h:mm A')}</div>
                        <div className="text-slate-400 text-xs">{moment(flight.start_time).format('MMM D')}</div>
                    </div>
                    <div className="flex-1 px-4 flex flex-col items-center">
                        <div className="w-full h-px bg-slate-200 dark:bg-white/10 relative">
                            <Plane size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{flight.duration || 'Direct'}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-slate-500 text-xs mb-1">Arrival</div>
                        <div className="font-bold text-slate-900 dark:text-white">{moment(flight.end_time).format('h:mm A')}</div>
                        <div className="text-slate-400 text-xs">{moment(flight.end_time).format('MMM D')}</div>
                    </div>
                </div>
            </div>
        );
    };

    const HotelCard = ({ hotel }) => (
        <div className="bg-white dark:bg-dark-800/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 mb-4 shadow-sm dark:shadow-none relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl bg-slate-200 dark:bg-white/5 overflow-hidden flex-shrink-0">
                    {hotel.image_url ? (
                        <img src={getImageUrl(hotel.image_url)} alt={hotel.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Hotel size={24} />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{hotel.title}</h3>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <MapPin size={10} />
                                <AddressLink location={hotel.location || 'Las Vegas, NV'} />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Check-in</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{moment(hotel.start_time).format('MMM D, h:mm A')}</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Check-out</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{moment(hotel.end_time).format('MMM D, h:mm A')}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const FlightBoard = ({ flights }) => {
        const [isOpen, setIsOpen] = useState(true);

        return (
            <div className="bg-black border-4 border-slate-900 dark:border-dark-800 rounded-xl overflow-hidden mb-8 font-mono shadow-2xl">
                <div
                    className="bg-slate-900 dark:bg-dark-800 px-6 py-3 flex justify-between items-center border-b border-white/10 cursor-pointer hover:bg-slate-800 transition"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <h3 className="text-yellow-500 font-bold tracking-widest uppercase flex items-center gap-2">
                        <Plane size={18} /> Flight Status
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className={`transform transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-6 space-y-4">
                                {flights.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 italic">
                                        {t('clientView.flightBoard.noData')}
                                    </div>
                                ) : (
                                    flights.map(flight => {
                                        const isDelayed = Math.random() > 0.8; // Mock delay
                                        const status = isDelayed ? t('clientView.flightBoard.delayed') : t('clientView.flightBoard.onTime');

                                        return (
                                            <div key={flight.id} className="flex flex-col md:flex-row justify-between items-center border-b border-white/10 pb-4 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-4 mb-2 md:mb-0 w-full md:w-auto">
                                                    <div className="text-2xl font-bold text-yellow-500 w-16">{moment(flight.start_time).format('HH:mm')}</div>
                                                    <div>
                                                        <div className="text-white font-bold text-lg">{flight.title}</div>
                                                        <div className="text-slate-400 text-sm">{flight.location}</div>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${isDelayed ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-green-500/20 text-green-500'}`}>
                                                    {status}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const ItineraryList = ({ items }) => {
        const flights = items.filter(i => i.type === 'flight');
        const hotels = items.filter(i => i.type === 'hotel');
        const activities = items.filter(i => i.type !== 'flight' && i.type !== 'hotel');

        // Group activities by day
        const groupedActivities = activities.reduce((acc, item) => {
            const date = moment(item.start_time).format('YYYY-MM-DD');
            if (!acc[date]) acc[date] = [];
            acc[date].push(item);
            return acc;
        }, {});

        // Sort dates
        const sortedDates = Object.keys(groupedActivities).sort();

        return (
            <div className="space-y-8" id="itinerary-content-export">
                {/* Flights & Hotels Section */}
                {(flights.length > 0 || hotels.length > 0) && (
                    <div className="mb-8 space-y-4">
                        {flights.map(flight => <FlightCard key={flight.id} flight={flight} />)}
                        {hotels.map(hotel => <HotelCard key={hotel.id} hotel={hotel} />)}
                    </div>
                )}

                <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 via-purple-500 to-transparent opacity-30"></div>

                    {sortedDates.map(date => (
                        <div key={date} className="relative">
                            {/* Day Header */}
                            <div className="flex items-center gap-4 mb-6 mt-8 pl-12 relative">
                                <div className="absolute left-[7px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-dark-900 border-4 border-primary-500 z-10 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    {moment(date).format('dddd, MMMM D')}
                                    <span className="text-xs font-normal text-slate-500 px-2 py-1 bg-slate-100 dark:bg-white/10 rounded-lg uppercase tracking-wider">
                                        Day {moment(date).diff(moment(client.trip_start).startOf('day'), 'days') + 1}
                                    </span>
                                </h3>
                            </div>

                            {/* Activities for this day */}
                            <div className="space-y-6">
                                {groupedActivities[date].map((item) => (
                                    <div key={item.id} className="relative pl-12 group">
                                        <div className="absolute left-[13px] top-6 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 z-10 group-hover:bg-primary-500 transition-colors"></div>
                                        <div
                                            className="bg-white dark:bg-dark-800/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 hover:bg-slate-50 dark:hover:bg-dark-800 transition cursor-pointer group-hover:border-primary-500/30 group-hover:shadow-lg group-hover:shadow-primary-500/5 backdrop-blur-sm shadow-sm dark:shadow-none relative overflow-hidden"
                                            onClick={() => setSelectedEvent(item)}
                                        >
                                            {/* Background Image with Low Opacity */}
                                            {item.image_url && (
                                                <div
                                                    className="absolute inset-0 z-0 opacity-10 dark:opacity-20 group-hover:opacity-15 dark:group-hover:opacity-25 transition-opacity bg-cover bg-center"
                                                    style={{ backgroundImage: `url(${getImageUrl(item.image_url)})` }}
                                                ></div>
                                            )}

                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                                                        <Ticket size={12} />
                                                        {item.type || 'Activity'}
                                                    </div>
                                                    <div className="text-slate-500 text-xs font-mono">{moment(item.start_time).format('h:mm A')}</div>
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{item.title}</h3>
                                                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={14} className="text-primary-500" />
                                                        {item.is_flexible ? (
                                                            <span className="italic text-primary-500 font-medium">Flexible</span>
                                                        ) : (
                                                            moment(item.start_time).format('h:mm A')
                                                        )}
                                                    </div>
                                                    {item.location && (
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin size={14} className="text-primary-500" />
                                                            <AddressLink location={item.location} />
                                                        </div>
                                                    )}
                                                </div>
                                                {item.description && (
                                                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-2">{item.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    ))}
                </div>

                <div className="pl-12 pt-4">
                    <button onClick={handleExportPDF} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition text-sm">
                        <Download size={16} /> {t('common.download')} PDF
                    </button>
                </div>
            </div >
        );
    };

    const DestinationMap = ({ items }) => {
        console.log('DestinationMap items:', items);
        const [geocodedItems, setGeocodedItems] = useState([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const geocodeItems = async () => {
                setLoading(true);

                // Load cache from localStorage
                const cache = JSON.parse(localStorage.getItem('geocodeCache') || '{}');
                let hasUpdates = false;

                const processed = await Promise.all(items.map(async (item, index) => {
                    if (!item.location) return null;

                    // 1. Check item itself (if DB had coords)
                    if (item.lat && item.lng) return item;

                    // 2. Check cache
                    const cacheKey = item.location.toLowerCase().trim();
                    if (cache[cacheKey]) {
                        return {
                            ...item,
                            lat: cache[cacheKey].lat,
                            lng: cache[cacheKey].lng
                        };
                    }

                    // 3. Fetch from API (with delay to avoid rate limits)
                    try {
                        // Add a small delay based on index to stagger requests
                        await new Promise(resolve => setTimeout(resolve, index * 200));

                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(item.location)}`);
                        const data = await res.json();
                        if (data && data.length > 0) {
                            const lat = parseFloat(data[0].lat);
                            const lng = parseFloat(data[0].lon);

                            // Update cache
                            cache[cacheKey] = { lat, lng };
                            hasUpdates = true;

                            return { ...item, lat, lng };
                        }
                    } catch (e) {
                        console.error("Geocoding failed for", item.title, e);
                    }
                    return null;
                }));

                // Save updated cache
                if (hasUpdates) {
                    localStorage.setItem('geocodeCache', JSON.stringify(cache));
                }

                setGeocodedItems(processed.filter(Boolean));
                setLoading(false);
            };

            geocodeItems();
        }, [items]);

        // Default to Vegas
        const center = [36.1699, -115.1398];

        return (
            <div className="h-[600px] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl relative z-0">
                <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url={darkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
                    />
                    {geocodedItems.map((item, idx) => {
                        let iconHtml = '';
                        let className = '';

                        if (item.type === 'flight') {
                            iconHtml = `<div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M13 2l9 10-9 10"/><path d="M2 12l5-5m0 10l-5-5"/></svg></div>`;
                            className = 'custom-div-icon flight-icon';
                        } else if (item.type === 'hotel') {
                            iconHtml = `<div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l8-4 8 4v14M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2M9 9h1v1H9V9m4 0h1v1h-1V9m-4 4h1v1H9v-1m4 0h1v1h-1v-1m-4 4h1v1H9v-1m4 0h1v1h-1v-1"/></svg></div>`;
                            className = 'custom-div-icon hotel-icon';
                        } else {
                            // Activity - Orange Pin with Label
                            iconHtml = `
                                <div class="flex flex-col items-center">
                                    <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white mb-1">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    </div>
                                    <div class="bg-white/90 text-dark-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap backdrop-blur-sm">
                                        ${item.title}
                                    </div>
                                </div>
                            `;
                            className = 'custom-div-icon activity-icon';
                        }

                        const customIcon = L.divIcon({
                            html: iconHtml,
                            className: className,
                            iconSize: [100, 60], // Adjust size to fit label
                            iconAnchor: [50, 40] // Adjust anchor to center pin
                        });

                        return (
                            <Marker
                                key={item.id}
                                position={[item.lat, item.lng]}
                                icon={customIcon}
                                eventHandlers={{
                                    click: () => setSelectedEvent(item)
                                }}
                            >
                                <Popup>
                                    <div className="p-2 min-w-[200px]">
                                        <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                                        <p className="text-xs text-slate-500 mb-2">{moment(item.start_time).format('MMM D, h:mm A')}</p>
                                        <AddressLink location={item.location} className="text-xs text-blue-600" />
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
        );
    };

    return (
        <div className={`${darkMode ? 'dark' : ''}`}>
            <div className="min-h-screen bg-gray-50 dark:bg-dark-950 text-slate-900 dark:text-slate-200 font-sans selection:bg-primary-500/30 transition-colors duration-300">
                {/* Header */}
                <header className="bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-40 transition-colors duration-300">
                    <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20">
                                V
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">Viva Vegas</h1>
                                {client && (
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                        {client.name} {client.travelers && client.travelers.length > 0 && `+ ${client.travelers.length}`}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 transition"
                            >
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <LanguageSwitcher />
                            <button onClick={handleContactAgent} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-white transition">
                                <Mail size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Hero / Countdown */}
                {showIntro && client.trip_start && (
                    <CountdownIntro targetDate={client.trip_start} />
                )}

                <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
                    {/* Weather */}
                    <WeatherWidget tripStart={client.trip_start} tripEnd={client.trip_end} />

                    {/* Flight Board */}
                    <FlightBoard flights={itinerary.filter(i => i.type === 'flight' && i.flight_number)} />

                    {/* Tabs */}
                    <div className="flex justify-center gap-2 mb-8 bg-white/80 dark:bg-white/5 p-1 rounded-full w-fit mx-auto backdrop-blur-md border border-slate-200 dark:border-white/10 flex-wrap shadow-sm dark:shadow-none transition-colors duration-300">
                        {['timeline', 'calendar', 'map', 'passes', 'catalog'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition whitespace-nowrap ${activeTab === tab
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                {t(`clientView.tabs.${tab}`) || tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'timeline' && (
                                <ItineraryList items={itinerary} />
                            )}

                            {activeTab === 'calendar' && (
                                <div className="h-[600px] bg-white dark:bg-dark-800/60 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                                    <Calendar
                                        localizer={localizer}
                                        events={itinerary.map(item => ({
                                            ...item,
                                            start: new Date(item.start_time),
                                            end: new Date(item.end_time),
                                            resource: item
                                        }))}
                                        startAccessor="start"
                                        endAccessor="end"
                                        style={{ height: '100%' }}
                                        eventPropGetter={eventPropGetter}
                                        views={['week', 'day', 'month']}
                                        view={calendarView}
                                        onView={setCalendarView}
                                        defaultDate={client.trip_start ? new Date(client.trip_start) : new Date()}
                                        min={new Date(0, 0, 0, 8, 0, 0)}
                                        max={new Date(0, 0, 0, 23, 59, 0)}
                                        components={{
                                            toolbar: CustomToolbar,
                                            event: CustomEvent
                                        }}
                                        onSelectEvent={(event) => setSelectedEvent(event.resource)}
                                    />
                                </div>
                            )}

                            {activeTab === 'passes' && (
                                <div className="space-y-8">
                                    {/* Unlimited Passes Section */}
                                    {(client.pass_url || (client.travelers && client.travelers.some(t => t.pass_url))) && (
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                <Ticket size={20} className="text-primary-500" />
                                                {t('Unlimited Passes')}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Main Client Pass */}
                                                {client.pass_url && (
                                                    <div
                                                        className="bg-white dark:bg-dark-800/60 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden group hover:border-primary-500/30 transition cursor-pointer shadow-sm dark:shadow-none"
                                                        onClick={() => setSelectedPass({ title: `${client.name} (Unlimited Pass)`, pass_url: client.pass_url, type: 'pass' })}
                                                    >
                                                        <div className="h-48 overflow-hidden relative">
                                                            <img src={getImageUrl(client.pass_url)} alt="Unlimited Pass" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent dark:from-dark-900/80 opacity-60"></div>
                                                            <div className="absolute bottom-3 left-3 right-3">
                                                                <h3 className="text-white font-bold truncate">{client.name}</h3>
                                                                <p className="text-xs text-primary-400 font-bold uppercase tracking-wider">Unlimited Pass</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Travelers Passes */}
                                                {client.travelers && client.travelers.map((traveler, idx) => (
                                                    traveler.pass_url && (
                                                        <div
                                                            key={idx}
                                                            className="bg-white dark:bg-dark-800/60 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden group hover:border-primary-500/30 transition cursor-pointer shadow-sm dark:shadow-none"
                                                            onClick={() => setSelectedPass({ title: `${traveler.name} (Unlimited Pass)`, pass_url: traveler.pass_url, type: 'pass' })}
                                                        >
                                                            <div className="h-48 overflow-hidden relative">
                                                                <img src={getImageUrl(traveler.pass_url)} alt="Unlimited Pass" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent dark:from-dark-900/80 opacity-60"></div>
                                                                <div className="absolute bottom-3 left-3 right-3">
                                                                    <h3 className="text-white font-bold truncate">{traveler.name}</h3>
                                                                    <p className="text-xs text-primary-400 font-bold uppercase tracking-wider">Unlimited Pass</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Individual Activity Passes */}
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <FileText size={20} className="text-slate-400" />
                                            {t('Activity Tickets')}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {itinerary.filter(i => i.pass_url || (i.type === 'flight' && i.image_url) || (i.traveler_passes && i.traveler_passes.length > 0)).length > 0 ? (
                                                itinerary.filter(i => i.pass_url || (i.type === 'flight' && i.image_url) || (i.traveler_passes && i.traveler_passes.length > 0)).map(item => (
                                                    <React.Fragment key={item.id}>
                                                        {/* Main Pass/Attachment */}
                                                        {(item.pass_url || (item.type === 'flight' && item.image_url)) && (
                                                            <div
                                                                className="bg-white dark:bg-dark-800/60 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden group hover:border-primary-500/30 transition cursor-pointer shadow-sm dark:shadow-none"
                                                                onClick={() => setSelectedPass(item)}
                                                            >
                                                                <div className="h-48 overflow-hidden relative">
                                                                    <img src={getImageUrl(item.pass_url || item.image_url)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent dark:from-dark-900/80 opacity-60"></div>
                                                                    <div className="absolute bottom-3 left-3 right-3">
                                                                        <h3 className="text-white font-bold truncate">{item.title}</h3>
                                                                        <p className="text-xs text-slate-200 dark:text-slate-300 flex items-center gap-1">
                                                                            <Clock size={10} /> {moment(item.start_time).format('MMM D, h:mm A')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Traveler Passes */}
                                                        {item.traveler_passes && item.traveler_passes.map((tp, idx) => (
                                                            <div
                                                                key={`${item.id}_${idx}`}
                                                                className="bg-white dark:bg-dark-800/60 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden group hover:border-primary-500/30 transition cursor-pointer shadow-sm dark:shadow-none"
                                                                onClick={() => setSelectedPass({ title: `${tp.name} - ${item.title}`, pass_url: tp.pass_url, type: 'pass' })}
                                                            >
                                                                <div className="h-48 overflow-hidden relative">
                                                                    <img src={getImageUrl(tp.pass_url)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent dark:from-dark-900/80 opacity-60"></div>
                                                                    <div className="absolute bottom-3 left-3 right-3">
                                                                        <h3 className="text-white font-bold truncate">{item.title}</h3>
                                                                        <p className="text-xs text-primary-400 font-bold uppercase tracking-wider mb-1">{tp.name}</p>
                                                                        <p className="text-xs text-slate-200 dark:text-slate-300 flex items-center gap-1">
                                                                            <Clock size={10} /> {moment(item.start_time).format('MMM D, h:mm A')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </React.Fragment>
                                                ))
                                            ) : (
                                                <div className="col-span-2 text-center py-12 bg-slate-50 dark:bg-dark-800/30 rounded-2xl border border-slate-200 dark:border-white/5 border-dashed">
                                                    <Ticket size={48} className="mx-auto text-slate-400 dark:text-slate-700 mb-4" />
                                                    <p className="text-slate-500">{t('clientView.passes.noPasses')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'map' && (
                                <DestinationMap items={itinerary} />
                            )}

                            {activeTab === 'catalog' && (
                                <CatalogView client={client} onUpdateClient={setClient} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Pass Modal */}
                <AnimatePresence>
                    {selectedPass && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedPass(null)}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative max-w-2xl w-full bg-dark-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <button onClick={() => setSelectedPass(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 z-10">
                                    <X size={20} />
                                </button>
                                <img src={getImageUrl(selectedPass.pass_url || selectedPass.image_url)} alt={selectedPass.title} className="w-full h-auto max-h-[80vh] object-contain bg-black" />
                                <div className="p-4 bg-dark-800 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-white font-bold">{selectedPass.title}</h3>
                                        <p className="text-slate-400 text-sm">Pass / Ticket</p>
                                    </div>
                                    <a
                                        href={getImageUrl(selectedPass.pass_url || selectedPass.image_url)}
                                        download
                                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold transition"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Download size={18} />
                                        {t('common.download')}
                                    </a>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Event Details Modal */}
                <AnimatePresence>
                    {selectedEvent && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                className="relative max-w-lg w-full overflow-hidden rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10 shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Modal Header Image */}
                                <div className="h-48 relative">
                                    {selectedEvent.image_url ? (
                                        <img src={getImageUrl(selectedEvent.image_url)} alt={selectedEvent.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-dark-800 dark:to-dark-700 flex items-center justify-center">
                                            <Ticket size={48} className="text-slate-400 dark:text-slate-600" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                    <button
                                        onClick={() => setSelectedEvent(null)}
                                        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
                                    >
                                        <X size={20} />
                                    </button>
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h2 className="text-2xl font-bold text-white mb-1">{selectedEvent.title}</h2>
                                        <div className="flex items-center gap-4 text-slate-300 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {moment(selectedEvent.start_time).format('h:mm A')} - {moment(selectedEvent.end_time).format('h:mm A')}
                                            </div>
                                            {selectedEvent.location && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    {selectedEvent.location}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Content */}
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold uppercase tracking-wider">
                                            {selectedEvent.type}
                                        </span>
                                        {selectedEvent.included_in_pass && (
                                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                                <Ticket size={12} /> {t('Included in Pass')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {selectedEvent.description && (
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{t('Description')}</h3>
                                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                                {selectedEvent.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Unlimited Passes Linked to this Activity */}
                                    {selectedEvent.included_in_pass && (client.pass_url || (client.travelers && client.travelers.some(t => t.pass_url))) && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{t('Unlimited Passes')}</h3>
                                            <div className="space-y-2">
                                                {client.pass_url && (
                                                    <button
                                                        onClick={() => { setSelectedPass({ title: `${client.name} (Unlimited Pass)`, pass_url: client.pass_url, type: 'pass' }); setSelectedEvent(null); }}
                                                        className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-dark-800/50 border border-slate-200 dark:border-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-800 transition group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-dark-900 overflow-hidden">
                                                                <img src={getImageUrl(client.pass_url)} className="w-full h-full object-cover" alt="Unlimited Pass" />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-sm font-medium text-slate-900 dark:text-white">{client.name}</div>
                                                                <div className="text-xs text-slate-500">{t('Unlimited Pass')}</div>
                                                            </div>
                                                        </div>
                                                        <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-white transition" />
                                                    </button>
                                                )}
                                                {client.travelers && client.travelers.map((traveler, idx) => (
                                                    traveler.pass_url && (
                                                        <button
                                                            key={idx}
                                                            onClick={() => { setSelectedPass({ title: `${traveler.name} (Unlimited Pass)`, pass_url: traveler.pass_url, type: 'pass' }); setSelectedEvent(null); }}
                                                            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-dark-800/50 border border-slate-200 dark:border-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-800 transition group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-dark-900 overflow-hidden">
                                                                    <img src={getImageUrl(traveler.pass_url)} className="w-full h-full object-cover" alt="Unlimited Pass" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{traveler.name}</div>
                                                                    <div className="text-xs text-slate-500">{t('Unlimited Pass')}</div>
                                                                </div>
                                                            </div>
                                                            <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-white transition" />
                                                        </button>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Individual Traveler Passes for this Activity */}
                                    {selectedEvent.traveler_passes && selectedEvent.traveler_passes.length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Traveler Tickets</h3>
                                            <div className="space-y-2">
                                                {selectedEvent.traveler_passes.map((tp, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => { setSelectedPass({ title: `${tp.name} - ${selectedEvent.title}`, pass_url: tp.pass_url, type: 'pass' }); setSelectedEvent(null); }}
                                                        className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-dark-800/50 border border-slate-200 dark:border-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-800 transition group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-dark-900 overflow-hidden">
                                                                <img src={getImageUrl(tp.pass_url)} className="w-full h-full object-cover" alt="Ticket" />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-sm font-medium text-slate-900 dark:text-white">{tp.name}</div>
                                                                <div className="text-xs text-slate-500">Ticket</div>
                                                            </div>
                                                        </div>
                                                        <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-white transition" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Attachments - Only show if there is a pass_url or if image_url is treated as attachment (legacy) AND it's not just the banner */}
                                    {(selectedEvent.pass_url || (selectedEvent.image_url && selectedEvent.type === 'flight')) && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Attachments</h3>
                                            <button
                                                onClick={() => { setSelectedPass(selectedEvent); setSelectedEvent(null); }}
                                                className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-dark-800/50 border border-slate-200 dark:border-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-800 transition group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-dark-900 overflow-hidden">
                                                        <img src={getImageUrl(selectedEvent.pass_url || selectedEvent.image_url)} className="w-full h-full object-cover" alt="Attachment" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-medium text-slate-900 dark:text-white">Attached Pass</div>
                                                        <div className="text-xs text-slate-500">Click to view full size</div>
                                                    </div>
                                                </div>
                                                <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-white transition" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ClientView;

