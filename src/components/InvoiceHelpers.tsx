'use client';

import dynamic from 'next/dynamic';

export const DynamicInvoiceButton = dynamic(
    () => import('@/components/InvoiceButton').then(mod => mod.InvoiceButton),
    { ssr: false }
);
