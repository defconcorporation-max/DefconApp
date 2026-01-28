import { HTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
    className,
    variant = 'default',
    ...props
}, ref) => {
    const variants = {
        default: "bg-white/10 text-[var(--text-secondary)]",
        success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        error: "bg-red-500/10 text-red-400 border border-red-500/20",
        outline: "bg-transparent border border-[var(--border-subtle)] text-[var(--text-tertiary)]"
    };

    return (
        <span
            ref={ref}
            className={twMerge(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                variants[variant],
                className
            )}
            {...props}
        />
    );
});

Badge.displayName = 'Badge';
