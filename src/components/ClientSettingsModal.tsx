'use client';

import { useState } from 'react';
import { updateClient, deleteClient } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { Settings, Trash2, X } from 'lucide-react';
import ClientLabelSelect from './ClientLabelSelect';

interface ClientSettingsModalProps {
    client: { id: number; name: string; company_name: string; plan: string; label_id?: number };
    labels: { id: number; name: string; color: string }[];
    isOpen: boolean;
    onClose: () => void;
}

export default function ClientSettingsModal({ client, labels, isOpen, onClose }: ClientSettingsModalProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
            const formData = new FormData();
            formData.append('id', client.id.toString());
            await deleteClient(formData);
            router.push('/'); // Redirect do dashboard
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl w-full max-w-md shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6 border-b border-[var(--border-subtle)]">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Settings size={18} />
                        Client Settings
                    </h3>
                </div>

                <div className="p-6 space-y-6">
                    <form action={async (formData) => { await updateClient(formData); onClose(); }} className="space-y-4">
                        <input type="hidden" name="id" value={client.id} />

                        <div className="space-y-1">
                            <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Company Name</label>
                            <input
                                name="company"
                                defaultValue={client.company_name}
                                className="pro-input w-full"
                                placeholder="Company Name"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Contact Name</label>
                            <input
                                name="name"
                                defaultValue={client.name}
                                className="pro-input w-full"
                                placeholder="Contact Name"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Plan</label>
                            <select
                                name="plan"
                                defaultValue={client.plan}
                                className="w-full bg-[var(--bg-root)] border border-[var(--border-subtle)] text-white text-sm rounded px-3 py-2 focus:border-[var(--text-secondary)] outline-none appearance-none"
                            >
                                <option value="Standard">Standard</option>
                                <option value="Gold">Gold</option>
                                <option value="Platinum">Platinum</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-[var(--text-secondary)] uppercase font-mono">Label</label>
                            <ClientLabelSelect
                                defaultValue={client.label_id || ''}
                                labels={labels}
                            />
                        </div>

                        <button type="submit" className="w-full pro-button py-2 justify-center">
                            Save Changes
                        </button>
                    </form>

                    <div className="pt-6 border-t border-[var(--border-subtle)]">
                        <button
                            onClick={handleDelete}
                            className="w-full py-2 flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 rounded transition-colors text-sm font-medium"
                        >
                            <Trash2 size={16} />
                            Delete Client
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper button component to trigger modal
export function ClientSettingsButton({ client, labels }: { client: any, labels: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors"
                title="Client Settings"
            >
                <Settings size={20} />
            </button>
            <ClientSettingsModal client={client} labels={labels} isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
