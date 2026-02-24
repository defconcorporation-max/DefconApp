'use client';

import dynamic from 'next/dynamic';

const SalesPlaybookButton = dynamic(
    () => import('@/components/settings/SalesPlaybookButton'),
    { ssr: false }
);

export default function SalesPlaybookWrapper() {
    return <SalesPlaybookButton />;
}
