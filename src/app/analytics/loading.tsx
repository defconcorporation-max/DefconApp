export default function Loading() {
    return (
        <main className="min-h-screen p-4 md:p-8 pt-20 md:pt-8 pb-20 animate-pulse">
            <div className="mb-8 pb-6 border-b border-[var(--border-subtle)]">
                <div className="h-7 w-40 bg-white/5 rounded mb-2"></div>
                <div className="h-4 w-72 bg-white/5 rounded"></div>
            </div>
            {/* Charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 h-72">
                    <div className="h-4 w-32 bg-white/5 rounded mb-4"></div>
                    <div className="h-full w-full bg-white/5 rounded"></div>
                </div>
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 h-72">
                    <div className="h-4 w-32 bg-white/5 rounded mb-4"></div>
                    <div className="h-full w-full bg-white/5 rounded"></div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 h-48">
                        <div className="h-4 w-24 bg-white/5 rounded mb-4"></div>
                        <div className="h-20 w-full bg-white/5 rounded"></div>
                    </div>
                ))}
            </div>
        </main>
    );
}
