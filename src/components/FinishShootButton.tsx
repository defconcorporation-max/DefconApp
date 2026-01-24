'use client';

import { finishShoot } from '@/app/actions';
import { Send } from 'lucide-react';
import { useState } from 'react';

export default function FinishShootButton({ shootId }: { shootId: number }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleFinish = async () => {
        alert('DEBUG: Button Clicked! If you see this, the button works.');

        /*
        if (typeof window !== 'undefined' && window.confirm('Send to Derush / Post-Production? This will mark the shoot as completed.')) {
            try {
                console.log('User confirmed, starting action...');
                setIsLoading(true);
                await finishShoot(shootId);
                console.log('Action completed');
            } catch (error: any) {
                console.error('Failed to finish shoot:', error);
                alert(`Error: ${error.message || 'Unknown error occurred'}`);
            } finally {
                setIsLoading(false);
            }
        }
        */
    };

    return (
        <button
            type="button"
            onClick={handleFinish}
            disabled={isLoading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Send size={18} />
            {isLoading ? 'Sending...' : 'Finish Shoot & Send to Post-Prod'}
        </button>
    );
}
