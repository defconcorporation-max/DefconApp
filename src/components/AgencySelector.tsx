'use client';

import { useRef } from 'react';
import { Building } from 'lucide-react';

export default function AgencySelector({ userId, currentAgencyId, agencies, updateAction, required }: {
    userId: number;
    currentAgencyId: number | null;
    agencies: { id: number; name: string }[];
    updateAction: (formData: FormData) => Promise<void>;
    required?: boolean;
}) {
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <form ref={formRef} action={updateAction} className="flex items-center gap-2">
            <input type="hidden" name="userId" value={userId} />
            <Building size={14} className={required && !currentAgencyId ? "text-amber-500 animate-pulse" : "text-[var(--text-tertiary)]"} />
            <select
                name="agencyId"
                defaultValue={currentAgencyId || ''}
                onChange={() => formRef.current?.requestSubmit()}
                className={`bg-transparent border rounded px-2 py-1 text-xs outline-none appearance-none cursor-pointer max-w-[120px] truncate ${required && !currentAgencyId
                        ? "border-amber-500 text-amber-500 font-bold"
                        : "border-[var(--border-subtle)] text-white focus:border-indigo-500"
                    }`}
            >
                <option value="">{required ? '-- Select Agency --' : '-- No Agency --'}</option>
                {agencies.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                ))}
            </select>
        </form>
    );
}
