'use client';

import { updateProjectStatus } from '@/app/actions';

export default function StatusSelector({
    projectId,
    currentStatus
}: {
    projectId: number,
    currentStatus: string
}) {
    console.log('Rendering StatusSelector Client Component');
    return (
        <form action={updateProjectStatus}>
            <input type="hidden" name="id" value={projectId} />
            <select
                name="status"
                defaultValue={currentStatus}
                onChange={(e) => e.target.form?.requestSubmit()}
                className="bg-black/20 border border-[var(--border-subtle)] text-[10px] uppercase text-white rounded px-2 py-1 focus:outline-none focus:border-[var(--text-secondary)]"
            >
                <option value="Planned">Planned</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
            </select>
        </form>
    );
}
