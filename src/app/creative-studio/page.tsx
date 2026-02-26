import { getClients } from '@/app/actions';
import CreativeStudio from '@/components/CreativeStudio';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CreativeStudioPage() {
    const session = await auth();
    if (!session) redirect('/login');

    const clients = await getClients();

    return (
        <main className="min-h-screen p-4 md:p-8 pt-20 md:pt-8 bg-[var(--bg-root)]">
            <header className="mb-12 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tighter text-white mb-2">
                        Creative <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Studio</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] text-lg max-w-xl leading-relaxed">
                        Where strategy meets high-concept production. Leverage AI to brainstorm, script, and analyze market gaps.
                    </p>
                </div>
            </header>

            <CreativeStudio clients={clients} />
        </main>
    );
}
