'use client';

import { useState } from 'react';
import { updateClientValue } from '@/app/actions';
import { DollarSign, Edit2, Check, X } from 'lucide-react';
import { Client } from '@/types';

export default function ClientValue({ client, isAdmin }: { client: Client, isAdmin: boolean }) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(client.client_value || 0);
    const [loading, setLoading] = useState(false);

    if (!isAdmin) return null;

    const handleSave = async () => {
        setLoading(true);
        await updateClientValue(client.id, value);
        setLoading(false);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <div className="relative">
                    <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(parseFloat(e.target.value))}
                        className="pl-7 pr-3 py-1 bg-[#1A1A1A] border border-emerald-500/50 rounded-md text-sm text-white focus:outline-none w-32"
                        autoFocus
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded-md"
                >
                    <Check size={16} />
                </button>
                <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 hover:bg-red-500/20 text-red-400 rounded-md"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-2">
                <DollarSign size={14} className="text-emerald-500" />
                <span className="font-bold text-emerald-400 font-mono">
                    {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
            <Edit2 size={12} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}
