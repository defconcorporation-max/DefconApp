import { getPostProdProject } from '@/app/post-prod-actions';
import PostProdWorkspace from '@/components/post-prod/PostProdWorkspace';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ShareReviewButton from '@/components/post-prod/ShareReviewButton';

export default async function PostProdProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getPostProdProject(Number(id));

    if (!data) return <div>Project not found</div>;

    const { project, tasks, versions } = data;

    return (
        <main className="min-h-screen p-6 bg-[var(--bg-root)] text-white">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/post-production" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{project.shoot_title}</h1>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded border border-indigo-500/30">
                            {project.template_name}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded border ${project.status === 'Completed'
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                            }`}>
                            {project.status}
                        </span>
                    </div>
                </div>
                <div className="ml-auto">
                    <ShareReviewButton projectId={project.id} />
                </div>
            </div>

            <PostProdWorkspace project={project} tasks={tasks} versions={versions} />
        </main>
    );
}
