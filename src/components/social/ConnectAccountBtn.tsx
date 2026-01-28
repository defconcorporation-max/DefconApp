import { Button } from '@/components/ui/Button';
import { Instagram, Linkedin, Facebook, Youtube, Video } from 'lucide-react';
import { signInAction } from '@/app/auth-actions';

interface ConnectProps {
    platform: 'instagram' | 'linkedin' | 'facebook' | 'tiktok' | 'youtube';
    clientId?: number;
}

export default function ConnectAccountBtn({ platform, clientId }: ConnectProps) {

    // Wrapper to match form action signature if needed, or just call directly via bind
    const handleConnect = async () => {
        await signInAction(platform, clientId);
    };

    const icons = {
        instagram: <Instagram size={16} />,
        linkedin: <Linkedin size={16} />,
        facebook: <Facebook size={16} />,
        youtube: <Youtube size={16} />,
        tiktok: <Video size={16} /> // Lucide doesn't have TikTok, using Video as placeholder or import explicit SVG if needed.
    };

    const labels = {
        instagram: 'Connect Instagram',
        linkedin: 'Connect LinkedIn',
        facebook: 'Connect Facebook',
        youtube: 'Connect YouTube',
        tiktok: 'Connect TikTok'
    };

    const colors = {
        instagram: 'hover:bg-pink-600 hover:text-white',
        linkedin: 'hover:bg-blue-600 hover:text-white',
        facebook: 'hover:bg-blue-700 hover:text-white',
        youtube: 'hover:bg-red-600 hover:text-white',
        tiktok: 'hover:bg-black hover:text-white hover:border-white'
    };

    // Using a form allows this to work even if JS is disabled (though NextAuth handles this)
    // But mainly it's the standard way to trigger server actions from client components without 'use client' hooks mess
    return (
        <form action={signInAction.bind(null, platform, clientId)}>
            <Button
                variant="secondary"
                size="sm"
                className={`w-full justify-start gap-2 ${colors[platform]} transition-colors group`}
            >
                <span className="text-[var(--text-tertiary)] group-hover:text-white transition-colors">
                    {icons[platform]}
                </span>
                {labels[platform]}
            </Button>
        </form>
    );
}
