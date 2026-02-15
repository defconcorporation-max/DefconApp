'use client';

import { useState, useRef } from 'react';
import { updateClientAvatar } from '@/app/actions';
import { Upload, Loader2, User } from 'lucide-react';
import { Client } from '@/types';

export default function ClientAvatar({ client }: { client: Client }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clientId', client.id.toString());

        // Ensure browser doesn't cache the old image immediately if URL stays same (though we usually change URL or invalidate)
        await updateClientAvatar(formData);

        setUploading(false);
        // Page should revalidate from server action
    };

    return (
        <div className="relative group w-16 h-16 rounded-full overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}>

            {client.avatar_url ? (
                <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
            ) : (
                <User className="text-[var(--text-tertiary)] w-8 h-8" />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                    <Upload className="w-5 h-5 text-white" />
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
}
