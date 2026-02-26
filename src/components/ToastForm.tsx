'use client';

import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

export function ToastForm({
    action,
    children,
    className,
    successMessage = 'Saved successfully',
    errorMessage = 'Failed to save'
}: {
    action: (formData: FormData) => Promise<void>;
    children: ReactNode;
    className?: string;
    successMessage?: string;
    errorMessage?: string;
}) {
    const router = useRouter();

    return (
        <form
            action={async (formData) => {
                try {
                    await action(formData);
                    toast.success(successMessage);
                    router.refresh();
                } catch (e) {
                    toast.error(errorMessage);
                }
            }}
            className={className}
        >
            {children}
        </form>
    );
}
