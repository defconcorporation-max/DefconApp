
'use client';

import { openClientFolder } from '@/app/actions';

export default function FolderButton({ folderPath }: { folderPath?: string }) {
    if (!folderPath) return null;

    return (
        <button
            onClick={() => openClientFolder(folderPath)}
            className="pro-button-secondary flex items-center gap-2 text-xs"
        >
            <span>📁</span>
            <span>Open Files</span>
        </button>
    );
}
