import { getReviewData, submitClientReview } from '@/app/review-actions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, AlertCircle, Play } from 'lucide-react';
import Image from 'next/image';

// Force dynamic since we check token
export const dynamic = 'force-dynamic';

export default async function ClientReviewPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const data = await getReviewData(token);

    if (!data) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                    <h1 className="text-2xl font-bold">Link Expired or Invalid</h1>
                    <p className="text-gray-400 mt-2">Please contact your project manager for a new link.</p>
                </div>
            </div>
        );
    }

    const { project, latestVersion } = data;

    async function handleReview(formData: FormData) {
        'use server';
        const decision = formData.get('decision') as 'Approved' | 'Changes Requested';
        const feedback = formData.get('feedback') as string;
        await submitClientReview(token, decision, feedback);
        // Simple refresh/redirect
        // In a real app we'd show a "Thank You" state, here we just refresh to show status update
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {/* Placeholder Logo */}
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">D</div>
                    <span className="font-bold tracking-wider">DEFCON VISUAL</span>
                </div>
                <div className="text-sm text-gray-400">
                    Project Review: <span className="text-white font-medium">{project.shoot_title}</span>
                </div>
            </header>

            <div className="pt-24 pb-12 px-4 max-w-5xl mx-auto">
                {/* VIDEO PLAYER */}
                <div className="aspect-video bg-black rounded-xl border border-white/10 shadow-2xl overflow-hidden mb-8 relative">
                    {latestVersion ? (
                        latestVersion.video_url.includes('youtube') || latestVersion.video_url.includes('vimeo') ? (
                            <iframe src={latestVersion.video_url} className="w-full h-full" allowFullScreen />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                                <a href={latestVersion.video_url} target="_blank" className="flex flex-col items-center gap-4 group">
                                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-sm">
                                        <Play size={32} className="ml-1 text-white" />
                                    </div>
                                    <span className="text-indigo-400 hover:underline">Click to Watch Video</span>
                                </a>
                            </div>
                        )
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            No video uploaded yet.
                        </div>
                    )}
                </div>

                {/* ACTION PANEL */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <h2 className="text-xl font-bold mb-4">Version Notes</h2>
                        <Card className="bg-[#111] p-6 border-white/10">
                            <p className="text-gray-300">
                                {latestVersion?.notes || "No specific notes for this version. Please review the cut above."}
                            </p>
                            <div className="mt-4 text-xs text-gray-500 uppercase font-bold tracking-widest">
                                Version {latestVersion?.version_number || 0}
                            </div>
                        </Card>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold mb-4">Your Decision</h2>
                        {project.status === 'Approved' ? (
                            <Card className="bg-green-500/10 border-green-500/20 p-8 text-center">
                                <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
                                <h3 className="text-2xl font-bold text-green-400">Approved</h3>
                                <p className="text-green-200/70 mt-2">You have approved this cut.</p>
                            </Card>
                        ) : (
                            <Card className="bg-[#111] p-6 border-white/10 space-y-4">
                                <form action={handleReview} className="space-y-4">
                                    <textarea
                                        name="feedback"
                                        placeholder="Leave feedback here if requesting changes..."
                                        className="w-full h-32 bg-black border border-white/10 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none resize-none"
                                    />

                                    <div className="flex flex-col gap-3">
                                        <button
                                            name="decision"
                                            value="Changes Requested"
                                            className="w-full py-3 rounded-lg border border-white/10 hover:bg-white/5 text-white font-medium transition-colors"
                                        >
                                            Request Changes
                                        </button>
                                        <button
                                            name="decision"
                                            value="Approved"
                                            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-500/20"
                                        >
                                            Approve Video
                                        </button>
                                    </div>
                                </form>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
