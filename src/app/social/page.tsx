import { getSocialAccounts, getSocialPosts } from '@/app/social-actions';
import { SocialAccount, SocialPost } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import ConnectAccountBtn from '@/components/social/ConnectAccountBtn';
import SocialPlanner from '@/components/social/SocialPlanner';
import { Badge } from '@/components/ui/Badge';

export default async function SocialPage() {
    const accounts = await getSocialAccounts();
    const posts = await getSocialPosts();

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <header className="mb-8 border-b border-[var(--border-subtle)] pb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Social Media</h1>
                        <p className="text-[var(--text-secondary)] text-sm">Plan, schedule, and publish content.</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Accounts Sidebar */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold uppercase text-[var(--text-tertiary)] mb-4">Connected Accounts</h3>
                        <div className="space-y-3">
                            {accounts.map(acc => (
                                <div key={acc.id} className="flex items-center gap-3 bg-[#0A0A0A] border border-[var(--border-subtle)] p-3 rounded-xl">
                                    <img src={acc.avatar_url} alt={acc.handle} className="w-10 h-10 rounded-full" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate">{acc.handle}</div>
                                        <div className="text-xs text-[var(--text-secondary)] capitalize">{acc.platform}</div>
                                    </div>
                                    <Badge variant="success" className="h-2 w-2 p-0 rounded-full" />
                                </div>
                            ))}
                            {accounts.length === 0 && <div className="text-sm text-[var(--text-tertiary)] italic">No accounts connected</div>}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold uppercase text-[var(--text-tertiary)] mb-4">Connect New</h3>
                        <div className="space-y-2">
                            <ConnectAccountBtn platform="instagram" />
                            <ConnectAccountBtn platform="linkedin" />
                            <ConnectAccountBtn platform="facebook" />
                        </div>
                    </div>
                </div>

                {/* Main Planner Area */}
                <div className="md:col-span-3">
                    <SocialPlanner initialPosts={posts} accounts={accounts} />
                </div>
            </div>
        </main>
    );
}
