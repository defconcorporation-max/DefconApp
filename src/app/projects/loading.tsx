export default function Loading() {
    return (
        <main className="min-h-screen p-4 md:p-8 pt-20 md:pt-8 pb-20 animate-pulse">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-[var(--border-subtle)]">
                <div>
                    <div className="h-6 w-32 bg-white/5 rounded mb-2"></div>
                    <div className="h-4 w-56 bg-white/5 rounded"></div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 h-48">
                        <div className="flex justify-between mb-4">
                            <div className="h-5 w-3/4 bg-white/5 rounded"></div>
                            <div className="h-5 w-16 bg-white/5 rounded"></div>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded mb-2"></div>
                        <div className="h-3 w-2/3 bg-white/5 rounded mb-6"></div>
                        <div className="h-8 w-full bg-white/5 rounded"></div>
                    </div>
                ))}
            </div>
        </main>
    );
}
