import { getPostProdItems, updatePostProdStatus } from '@/app/actions';
import { PostProductionItem } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, Film, AlertCircle } from 'lucide-react';
import PostProdBoard from '@/components/PostProdBoard';

export default async function PostProductionPage() {
    const items = await getPostProdItems() as PostProductionItem[];

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <header className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-medium tracking-tight">Post-Production</h1>
                </div>
            </header>

            <PostProdBoard initialItems={items} />
        </main>
    );
}
