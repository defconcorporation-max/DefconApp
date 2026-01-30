'use client';

import { Service } from '@/types';
import { updateService, deleteService } from '@/app/actions';
import { Trash2, Edit2, Save, X } from 'lucide-react';
import { useState } from 'react';

// Sub-component for individual item
function ServiceItem({ service }: { service: Service }) {
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [name, setName] = useState(service.name);
    const [rate, setRate] = useState(service.default_rate);
    const [type, setType] = useState(service.rate_type);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const formData = new FormData();
        formData.append('id', service.id.toString());
        formData.append('name', name);
        formData.append('rate', rate.toString());
        formData.append('type', type);

        await updateService(formData);

        setIsSaving(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setName(service.name);
        setRate(service.default_rate);
        setType(service.rate_type);
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this service?')) {
            await deleteService(service.id);
        }
    };

    if (isEditing) {
        return (
            <div className="bg-[#111] border border-blue-500/50 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-colors shadow-lg shadow-blue-500/5">
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pro-input w-full"
                        placeholder="Service Name"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <input
                            type="number"
                            step="0.01"
                            value={rate}
                            onChange={(e) => setRate(parseFloat(e.target.value))}
                            className="pro-input w-full"
                            placeholder="Rate"
                        />
                    </div>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="bg-[#18181b] border border-[var(--border-subtle)] rounded px-3 py-2 text-sm text-white w-full outline-none focus:border-violet-500"
                    >
                        <option value="Fixed">Fixed Price</option>
                        <option value="Hourly">Per Hour</option>
                        <option value="Day">Per Day</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    {/* Delete is risky in edit mode, but let's allow it for quickcleanup */}
                    <button
                        onClick={handleDelete}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mr-2"
                        title="Delete Service"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Cancel"
                    >
                        <X size={18} />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors shadow-lg shadow-green-600/20"
                        title="Save Changes"
                    >
                        {isSaving ? <span className="animate-spin block w-4 h-4 border-2 border-white/20 border-t-white rounded-full" /> : <Save size={18} />}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-4 flex items-center justify-between group hover:border-violet-500/30 transition-colors">
            <div>
                <h3 className="font-medium text-white text-lg">{service.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                    ${service.default_rate} <span className="text-[var(--text-tertiary)]">/ {service.rate_type}</span>
                </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                    title="Edit Service"
                >
                    <Edit2 size={18} />
                </button>
                <button
                    onClick={handleDelete}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Service"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}

export default function ServiceList({ services }: { services: Service[] }) {
    if (services.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl border-dashed">
                No services defined yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {services.map(service => (
                <div key={service.id} className="relative">
                    <ServiceItem service={service} />
                </div>
            ))}
        </div>
    );
}
