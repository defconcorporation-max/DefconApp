'use client';

import { deleteActor } from '@/app/actor-actions';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ActorActions({ actorId }: { actorId: number }) {
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this actor?')) return;
        await deleteActor(actorId);
        toast.success('Actor deleted');
        router.push('/actors');
    };

    return (
        <button type="button" onClick={handleDelete} className="px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors flex items-center gap-2">
            <Trash2 size={14} /> Delete Actor
        </button>
    );
}
