'use client';

import { useState } from 'react';
import { updateProjectTitle } from '@/app/actions';
import { Pencil, Check, X } from 'lucide-react';

interface ProjectTitleEditorProps {
    projectId: number;
    initialTitle: string;
}

export default function ProjectTitleEditor({ projectId, initialTitle }: ProjectTitleEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(initialTitle);

    const handleSave = async () => {
        const formData = new FormData();
        formData.append('id', projectId.toString());
        formData.append('title', title);
        await updateProjectTitle(formData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTitle(initialTitle);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 mb-2">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-transparent border border-[var(--border-subtle)] rounded px-2 py-1 text-3xl font-bold tracking-tight text-white focus:border-[var(--text-secondary)] outline-none min-w-[300px]"
                    autoFocus
                />
                <button
                    onClick={handleSave}
                    className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors"
                >
                    <Check size={20} />
                </button>
                <button
                    onClick={handleCancel}
                    className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        );
    }

    return (
        <div className="group flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{initialTitle}</h1>
            <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-tertiary)] hover:text-white"
            >
                <Pencil size={18} />
            </button>
        </div>
    );
}
