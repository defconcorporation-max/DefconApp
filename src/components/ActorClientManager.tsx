'use client';

import { toast } from 'react-hot-toast';
import { addActorClient, removeActorClient } from '@/app/actor-actions';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

export function ActorClientList({ actorClients, actorId }: { actorClients: any[], actorId: number }) {
    if (actorClients.length === 0) {
        return <p className="text-xs text-[var(--text-tertiary)] italic text-center py-4">No clients linked yet.</p>;
    }

    return (
        <div className="space-y-2 mb-4">
            {actorClients.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between text-sm bg-white/5 px-4 py-2.5 rounded-lg">
                    <Link href={`/clients/${c.id}`} className="text-white hover:text-violet-400 transition-colors font-medium">
                        {c.company_name || c.name}
                    </Link>
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await removeActorClient(actorId, c.id);
                                toast.success('Client unlinked');
                            } catch (error) {
                                toast.error('Failed to unlink client');
                            }
                        }}
                        className="text-red-400/50 hover:text-red-400 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}

export function ActorClientForm({ allClients, actorClients, actorId }: { allClients: any[], actorClients: any[], actorId: number }) {
    return (
        <form
            action={async (formData: FormData) => {
                const clientId = Number(formData.get('clientId'));
                if (!clientId) return;
                try {
                    await addActorClient(actorId, clientId);
                    toast.success('Client linked successfully');
                } catch (error) {
                    toast.error('Failed to link client');
                }
            }}
            className="flex gap-2"
        >
            <select name="clientId" className="flex-1 pro-input text-xs">
                <option value="">Link a client...</option>
                {allClients.filter((c: any) => !actorClients.find((ac: any) => ac.id === c.id)).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.company_name || c.name}</option>
                ))}
            </select>
            <button type="submit" className="px-4 py-1.5 bg-violet-500/20 text-violet-400 text-xs rounded-full hover:bg-violet-500/30 transition-colors font-medium">
                Link
            </button>
        </form>
    );
}
