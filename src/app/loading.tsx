export default function Loading() {
    return (
        <main className="min-h-screen p-4 md:p-8 pt-20 md:pt-8 animate-pulse">
            {/* Stats Skeleton */}
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-[var(--border-subtle)]">
                <div>
                    <div className="h-6 w-48 bg-white/5 rounded mb-2"></div>
                    <div className="h-4 w-32 bg-white/5 rounded"></div>
                </div>
            </div>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 h-24">
                        <div className="h-3 w-20 bg-white/5 rounded mb-3"></div>
                        <div className="h-8 w-16 bg-white/5 rounded"></div>
                    </div>
                ))}
            </section>
            {/* Kanban Skeleton */}
            <div className="flex gap-4 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="min-w-[280px] bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl h-[400px]">
                        <div className="p-4 border-b border-[var(--border-subtle)]">
                            <div className="h-4 w-24 bg-white/5 rounded"></div>
                        </div>
                        <div className="p-3 space-y-3">
                            {[...Array(3)].map((_, j) => (
                                <div key={j} className="bg-[#121212] border border-[var(--border-subtle)] rounded-lg p-4 h-20">
                                    <div className="h-4 w-3/4 bg-white/5 rounded mb-2"></div>
                                    <div className="h-3 w-1/2 bg-white/5 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
