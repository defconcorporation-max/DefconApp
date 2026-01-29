'use client';

import { useState, useRef } from 'react';
import { updateShootVideoNotes } from '@/app/actions';

export default function NotesEditor({
    noteId,
    initialContent,
    videoId,
    clientId,
    shootId
}: {
    noteId: number,
    initialContent: string,
    videoId: number,
    clientId: number,
    shootId: number
}) {
    const [content, setContent] = useState(initialContent);
    const [isEditing, setIsEditing] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleBlur = () => {
        setIsEditing(false);
        if (content !== initialContent) {
            formRef.current?.requestSubmit();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Allow default behavior (new line) - User explicitly asked for this.
            // "entrer key should not save but return to the line"
            e.stopPropagation();
        }
    };

    return (
        <form ref={formRef} action={updateShootVideoNotes} className="flex-1">
            <input type="hidden" name="id" value={noteId} />
            <input type="hidden" name="videoId" value={videoId} />
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="shootId" value={shootId} />

            <textarea
                name="notes"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-xs text-[var(--text-secondary)] focus:text-white focus:outline-none resize-none overflow-hidden hover:bg-white/5 rounded px-1 -mx-1 transition-colors"
                rows={Math.max(1, content.split('\n').length)}
                spellCheck={false}
            />
        </form>
    );
}
