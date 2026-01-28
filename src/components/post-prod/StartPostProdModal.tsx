'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Film, Video, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PostProdTemplate } from '@/types';
import { startPostProduction } from '@/app/post-prod-actions';
import { useRouter } from 'next/navigation';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    shootId: number;
    templates: PostProdTemplate[];
}

export default function StartPostProdModal({ isOpen, onClose, shootId, templates }: Props) {
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleStart = async () => {
        if (!selectedTemplate) return;
        setIsSubmitting(true);
        try {
            const projectId = await startPostProduction(shootId, selectedTemplate);
            router.push(`/post-production/${projectId}`);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIcon = (name: string) => {
        if (name.includes('Music')) return <Film className="text-purple-400" size={24} />;
        if (name.includes('Corporate')) return <Video className="text-blue-400" size={24} />;
        return <Share2 className="text-pink-400" size={24} />;
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-2xl bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[#111]">
                        <Dialog.Title className="text-xl font-bold">Start Post-Production</Dialog.Title>
                        <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        <p className="text-[var(--text-secondary)] mb-6">
                            Select a workflow template to generate your automated checklist.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {templates.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTemplate(t.id)}
                                    className={`relative flex flex-col items-center p-6 rounded-xl border transition-all ${selectedTemplate === t.id
                                            ? 'bg-white/5 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                            : 'bg-[#151515] border-[var(--border-subtle)] hover:border-white/20'
                                        }`}
                                >
                                    <div className="mb-4 p-3 bg-black rounded-full border border-white/10">
                                        {getIcon(t.name)}
                                    </div>
                                    <h3 className="font-bold text-center mb-2">{t.name}</h3>
                                    <div className="text-xs text-[var(--text-tertiary)] text-center">
                                        {(t.tasks || []).slice(0, 3).join(', ')}...
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-subtle)]">
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button
                                disabled={!selectedTemplate || isSubmitting}
                                onClick={handleStart}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                            >
                                {isSubmitting ? 'Initializing...' : 'Start Workflow'}
                            </Button>
                        </div>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
