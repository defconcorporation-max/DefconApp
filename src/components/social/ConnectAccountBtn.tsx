'use client';
import { Button } from '@/components/ui/Button';
import { connectSocialAccount } from '@/app/social-actions';
import { useState } from 'react';
import { Database, Loader2 } from 'lucide-react';

export default function ConnectAccountBtn({ platform }: { platform: string }) {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        await connectSocialAccount(platform);
        setLoading(false);
    };

    const colors: Record<string, string> = {
        instagram: 'hover:bg-pink-600',
        linkedin: 'hover:bg-blue-600',
        facebook: 'hover:bg-blue-500'
    };

    return (
        <Button
            onClick={handleConnect}
            disabled={loading}
            className={`w-full justify-start gap-2 bg-[#1A1A1A] border border-[var(--border-subtle)] text-white ${colors[platform]}`}
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
            Connect {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </Button>
    );
}
