'use client';

import { useState, useRef } from 'react';
import { updateShootVideoTitle } from '@/app/actions';

export default function VideoTitleEditor({
    videoId,
    initialTitle,
    clientId,
    shootId,
    completed
}: {
    videoId: number,
    initialTitle: string,
    clientId: number,
    shootId: number,
    completed: boolean
}) {
    const [title, setTitle] = useState(initialTitle);
    const formRef = useRef<HTMLFormElement>(null);

    const handleBlur = () => {
        if (title !== initialTitle) {
            formRef.current?.requestSubmit();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            formRef.current?.requestSubmit();
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <form ref={formRef} action={updateShootVideoTitle.bind(null, videoId, title, clientId, shootId)} className="flex-1">
            <input type="hidden" name="id" value={videoId} />
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="shootId" value={shootId} />

            <input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`w-full bg-transparent font-medium focus:outline-none transition-colors border-b border-transparent focus:border-violet-500 ${completed ? 'text-[var(--text-tertiary)] line-through' : 'text-white'}`}
            />
        </form>
    );
}
