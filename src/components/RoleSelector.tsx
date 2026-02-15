'use client';

import { useRef } from 'react';
import { Shield } from 'lucide-react';

export default function RoleSelector({ userId, currentRole, roles, updateAction }: {
    userId: number;
    currentRole: string;
    roles: { value: string; label: string }[];
    updateAction: (formData: FormData) => Promise<void>;
}) {
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <form ref={formRef} action={updateAction} className="flex items-center gap-2">
            <input type="hidden" name="userId" value={userId} />
            <Shield size={14} className="text-[var(--text-tertiary)]" />
            <select
                name="role"
                defaultValue={currentRole}
                onChange={() => formRef.current?.requestSubmit()}
                className="bg-transparent border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-white focus:border-indigo-500 outline-none appearance-none cursor-pointer"
            >
                {roles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                ))}
            </select>
        </form>
    );
}
