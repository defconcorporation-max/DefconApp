'use client';

import { useState } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';

export default function MoodboardGrid({ images, setImages }: { images: string[], setImages: (imgs: string[]) => void }) {
    const [urlInput, setUrlInput] = useState('');
    const [showInput, setShowInput] = useState(false);

    const addImage = () => {
        if (!urlInput) return;
        setImages([...images, urlInput]);
        setUrlInput('');
        setShowInput(false);
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-[var(--text-secondary)]">
                    Direct URLs or Cloud Links.
                </p>
                <button
                    onClick={() => setShowInput(!showInput)}
                    className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                >
                    <Plus size={16} />
                    Add Image
                </button>
            </div>

            {showInput && (
                <div className="flex gap-2 mb-4 bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-subtle)]">
                    <input
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
                        onKeyDown={(e) => e.key === 'Enter' && addImage()}
                        autoFocus
                    />
                    <button onClick={addImage} className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-200">
                        Add
                    </button>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((url, i) => (
                    <div key={i} className="group relative aspect-[9/16] md:aspect-square rounded-lg overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                        <img src={url} alt={`Mood ${i}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={() => removeImage(i)}
                                className="bg-red-500/80 p-2 rounded-full text-white hover:bg-red-500"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                ))}

                {images.length === 0 && !showInput && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-[var(--text-tertiary)] border-2 border-dashed border-[var(--border-subtle)] rounded-lg cursor-pointer hover:border-pink-500/50 hover:text-pink-400 transition-colors" onClick={() => setShowInput(true)}>
                        <ImageIcon size={32} className="mb-2" />
                        <span className="text-sm">Add images to moodboard</span>
                    </div>
                )}
            </div>
        </div>
    );
}
