import { getPostProdProject } from '@/app/post-prod-actions';
import { getProjectFeedback } from '@/app/review-actions';
import PostProdWorkspace from '@/components/post-prod/PostProdWorkspace';
import FeedbackPanel from '@/components/post-prod/FeedbackPanel';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import ShareReviewButton from '@/components/post-prod/ShareReviewButton';

export default async function PostProdProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [data, feedback] = await Promise.all([
        getPostProdProject(Number(id)),
        getProjectFeedback(Number(id)),
    ]);

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
                        <Link href={`/shoots/${project.shoot_id}`} className="hover:text-violet-400 transition-colors flex items-center gap-2 group">
                            <h1 className="text-2xl font-bold">{project.shoot_title}</h1>
                            <ExternalLink size={18} className="opacity-0 group-hover:opacity-100 transition-opacity translate-y-0.5" />
                        </Link>
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

            <FeedbackPanel feedback={feedback} projectId={project.id} />
            <PostProdWorkspace project={project} tasks={tasks} versions={versions} />
        </main>
    );
}
