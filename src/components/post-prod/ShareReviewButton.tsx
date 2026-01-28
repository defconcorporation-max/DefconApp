'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Link2, Check } from 'lucide-react';
import { generateReviewLink } from '@/app/review-actions';

export default function ShareReviewButton({ projectId }: { projectId: number }) {
    const [link, setLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        const token = await generateReviewLink(projectId);
        // Assuming localhost for dev, in prod use window.location.origin
        const origin = window.location.origin;
        setLink(`${origin}/review/${token}`);
    };

    const handleCopy = () => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (link) {
        return (
            <div className="flex items-center gap-2 bg-[#151515] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] animate-in fade-in">
                <span className="text-xs text-[var(--text-secondary)] truncate max-w-[150px]">{link}</span>
                <button onClick={handleCopy} className="text-indigo-400 hover:text-white">
                    {copied ? <Check size={14} /> : <Link2 size={14} />}
                </button>
            </div>
        );
    }

    return (
        <Button variant="ghost" size="sm" onClick={handleGenerate}>
            <Link2 size={16} className="mr-2" />
            Share Review Link
        </Button>
    );
}
