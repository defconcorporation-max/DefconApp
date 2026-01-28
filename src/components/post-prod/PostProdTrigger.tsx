'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import StartPostProdModal from './StartPostProdModal';
import { PostProdTemplate } from '@/types';
import { Settings, Video } from 'lucide-react';

interface Props {
    shootId: number;
    templates: PostProdTemplate[];
    shootStatus: string;
}

export default function PostProdTrigger({ shootId, templates, shootStatus }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (shootStatus !== 'Scheduled' && shootStatus !== 'In Progress') {
        // If already completed/cancelled, maybe show a "View Post-Prod" button if a project exists?
        // For now, we only show the "Start" trigger if it's active.
        // Actually, if it is completed, we might want to start post-prod if not started yet.
        // Let's assume this button is the primary way to "Finish" the shoot.
        return null;
    }

    return (
        <>
            <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-violet-500/25"
                >
                    <Video size={18} />
                    Finish Shoot & Start Post-Prod
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
