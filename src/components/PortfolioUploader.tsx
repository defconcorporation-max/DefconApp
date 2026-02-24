'use client';

import { useState, useRef } from 'react';
import { addPortfolioItem, deletePortfolioItem, updateActorProfilePicture } from '@/app/actor-actions';
import { Upload, X, Image, Film, Loader2, Camera, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface PortfolioItem {
    id: number;
    actor_id: number;
    url: string;
    file_type: string;
    file_name: string;
    created_at: string;
}

async function uploadFile(file: File, folder: string): Promise<{ url: string; success: boolean; error?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    return await res.json();
}

// ── Profile Picture Uploader ──
export function ProfilePictureUploader({ actorId, currentPicture, actorName }: { actorId: number; currentPicture?: string; actorName: string }) {
    const [uploading, setUploading] = useState(false);
    const [picture, setPicture] = useState(currentPicture || '');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }
        setUploading(true);
        setError('');
        try {
            const result = await uploadFile(file, `actors/${actorId}/profile`);
            if (!result.success) {
                setError(result.error || 'Upload failed');
                toast.error(result.error || 'Upload failed');
                return;
            }
            await updateActorProfilePicture(actorId, result.url);
            setPicture(result.url);
            toast.success('Profile picture updated');
            router.refresh();
        } catch (err) {
            toast.error('Upload failed');
            setError('Upload failed. Check your Vercel Blob configuration.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative group">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-[#0A0A0A] overflow-hidden bg-gradient-to-br from-violet-500/20 to-indigo-500/20 shadow-2xl">
                {picture ? (
                    <img src={picture} alt={actorName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-violet-400 font-bold text-4xl">
                        {actorName.charAt(0)}
                    </div>
                )}
            </div>
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-lg hover:bg-violet-500 transition-colors border-2 border-[#0A0A0A]"
            >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
            {error && (
                <div className="absolute -bottom-8 left-0 right-0 text-center">
                    <span className="text-[10px] text-red-400">{error}</span>
                </div>
            )}
        </div>
    );
}

// ── Portfolio Grid Uploader ──
export default function PortfolioUploader({ actorId, portfolio: initialPortfolio }: { actorId: number; portfolio: PortfolioItem[] }) {
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>(initialPortfolio);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setError('');

        try {
            for (const file of Array.from(files)) {
                const isImage = file.type.startsWith('image/');
                const isVideo = file.type.startsWith('video/');
                if (!isImage && !isVideo) {
                    toast.error(`${file.name} is not an image or video`);
                    continue;
                }

                const result = await uploadFile(file, `actors/${actorId}/portfolio`);
                if (!result.success) {
                    setError(result.error || 'Upload failed');
                    toast.error(result.error || `Failed to upload ${file.name}`);
                    continue;
                }

                await addPortfolioItem(actorId, result.url, isImage ? 'image' : 'video', file.name);

                setPortfolio(prev => [{
                    id: Date.now() + Math.random(),
                    actor_id: actorId,
                    url: result.url,
                    file_type: isImage ? 'image' : 'video',
                    file_name: file.name,
                    created_at: new Date().toISOString(),
                }, ...prev]);
            }
            if (!error) toast.success('Upload complete');
            router.refresh();
        } catch (err) {
            toast.error('Upload failed');
            setError('Upload failed. Check your Vercel Blob configuration.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        setPortfolio(prev => prev.filter(p => p.id !== id));
        await deletePortfolioItem(id);
        toast.success('Media removed');
        router.refresh();
    };

    return (
        <div>
            {/* Error Banner */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Upload Button */}
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-6 ${dragOver
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-[var(--border-subtle)] hover:border-violet-500/40 hover:bg-white/5'
                    }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
            >
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden"
                    onChange={(e) => handleUpload(e.target.files)} />
                {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-violet-400">
                        <Loader2 size={24} className="animate-spin" />
                        <span className="text-sm font-medium">Uploading...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                            <Upload size={20} className="text-violet-400" />
                        </div>
                        <span className="text-sm text-white font-medium">Add to Portfolio</span>
                        <span className="text-xs text-[var(--text-tertiary)]">Drop images or videos, or click to browse</span>
                    </div>
                )}
            </div>

            {/* Instagram-style Grid */}
            {portfolio.length > 0 && (
                <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                    {portfolio.map(item => (
                        <div key={item.id} className="relative aspect-square group overflow-hidden bg-[#111]">
                            {item.file_type === 'image' ? (
                                <img src={item.url} alt={item.file_name || ''} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full relative">
                                    <video src={item.url} className="w-full h-full object-cover" />
                                    <div className="absolute top-2 right-2">
                                        <Film size={16} className="text-white drop-shadow-lg" />
                                    </div>
                                </div>
                            )}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2.5 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
