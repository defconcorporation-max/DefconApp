import { HTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
    className,
    hoverEffect = false,
    ...props
}, ref) => {
    return (
        <div
            ref={ref}
            className={twMerge(
                "bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl overflow-hidden p-6 relative",
                hoverEffect && "hover:border-[var(--border-strong)] transition-colors group",
                className
            )}
            {...props}
        />
    );
});

Card.displayName = 'Card';
