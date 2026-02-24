'use client';

import { useState, useRef } from 'react';
import { addPortfolioItem, deletePortfolioItem } from '@/app/actor-actions';
import { Upload, X, Image, Film, Loader2 } from 'lucide-react';
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

export default function PortfolioUploader({ actorId, portfolio: initialPortfolio }: { actorId: number, portfolio: PortfolioItem[] }) {
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>(initialPortfolio);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                // Validate file type
                const isImage = file.type.startsWith('image/');
                const isVideo = file.type.startsWith('video/');
                if (!isImage && !isVideo) {
                    toast.error(`${file.name} is not an image or video`);
                    continue;
                }

                // Upload to Vercel Blob via our API
                const formData = new FormData();
                formData.append('file', file);
                formData.append('actorId', actorId.toString());

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                const result = await res.json();

                if (!result.success) {
                    toast.error(`Failed to upload ${file.name}`);
                    continue;
                }

                // Save to DB
                await addPortfolioItem(actorId, result.url, isImage ? 'image' : 'video', file.name);

                // Optimistic update
                setPortfolio(prev => [{
                    id: Date.now(),
                    actor_id: actorId,
                    url: result.url,
                    file_type: isImage ? 'image' : 'video',
                    file_name: file.name,
                    created_at: new Date().toISOString(),
                }, ...prev]);
            }

            toast.success('Upload complete');
            router.refresh();
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed');
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
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Portfolio</h3>

            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all mb-4 ${dragOver
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-[var(--border-subtle)] hover:border-[var(--text-tertiary)] hover:bg-white/5'
                    }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleUpload(e.dataTransfer.files);
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                />
                {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-violet-400">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-sm">Uploading...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload size={24} className="text-[var(--text-tertiary)]" />
                        <span className="text-xs text-[var(--text-tertiary)]">
                            Drop images or videos, or click to browse
                        </span>
                    </div>
                )}
            </div>

            {/* Portfolio Grid */}
            {portfolio.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)] italic text-center">No portfolio items yet.</p>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {portfolio.map(item => (
                        <div key={item.id} className="relative group rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-black">
                            {item.file_type === 'image' ? (
                                <img
                                    src={item.url}
                                    alt={item.file_name || 'Portfolio'}
                                    className="w-full h-32 object-cover"
                                />
                            ) : (
                                <div className="w-full h-32 flex items-center justify-center bg-gradient-to-br from-violet-500/10 to-indigo-500/10">
                                    <video src={item.url} className="w-full h-full object-cover" />
                                </div>
                            )}
                            {/* Overlay with delete */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            {/* Type badge */}
                            <div className="absolute bottom-1 left-1">
                                {item.file_type === 'image'
                                    ? <Image size={12} className="text-white/50" />
                                    : <Film size={12} className="text-white/50" />
                                }
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
