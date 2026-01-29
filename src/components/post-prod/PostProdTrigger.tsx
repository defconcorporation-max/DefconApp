'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import StartPostProdModal from './StartPostProdModal';
import { PostProdTemplate } from '@/types';
import { Settings, Video } from 'lucide-react';

interface Props {
    shootId: number;
    templates: PostProdTemplate[];
    postProdId?: number;
    postProdStatus?: string;
}

export default function PostProdTrigger({ shootId, templates, shootStatus, postProdId, postProdStatus }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // If Post-Prod has started, show the "Go to" button
    if (postProdId) {
        return (
            <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                <a href={`/post-production/${postProdId}`} className="block w-full">
                    <Button
                        variant="secondary"
                        className="w-full bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/20 font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Video size={18} />
                        View Post-Production Project
                    </Button>
                </a>
                <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">
                    Status: <span className="text-white font-bold">{postProdStatus}</span>
                </p>
            </div>
        );
    }

    if (shootStatus !== 'Scheduled' && shootStatus !== 'In Progress') {
        // If completed but NO post-prod project (e.g. manual finish), show nothing or maybe a "Start Post-Prod" anyway?
        // User asked for "Send to post prod button". If manually formatted as completed without post-prod (legacy), maybe we allow starting it?
        // Let's allow starting it even if completed, if no project exists.
    }

    return (
        <>
            <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-violet-500/25"
                >
                    <Video size={18} />
                    {shootStatus === 'Completed' ? 'Create Post-Prod Project' : 'Finish Shoot & Start Post-Prod'}
                </Button>
                <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">
                    Marks shoot as done and generates editing workflow.
                </p>
            </div>

            <StartPostProdModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                shootId={shootId}
                templates={templates}
            />
        </>
    );
}
