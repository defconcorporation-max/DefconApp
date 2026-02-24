export default function Loading() {
    return (
        <div className="flex animate-pulse">
            <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-20">
                <div className="mb-8">
                    <div className="h-7 w-32 bg-white/5 rounded mb-2"></div>
                    <div className="h-4 w-64 bg-white/5 rounded"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 h-32">
                        <div className="h-4 w-20 bg-white/5 rounded mb-3"></div>
                        <div className="h-3 w-full bg-white/5 rounded"></div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 h-32">
                        <div className="h-4 w-20 bg-white/5 rounded mb-3"></div>
                        <div className="h-3 w-full bg-white/5 rounded"></div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 h-32">
                        <div className="h-4 w-20 bg-white/5 rounded mb-3"></div>
                        <div className="h-3 w-full bg-white/5 rounded"></div>
                    </div>
                </div>
                {/* Settings form placeholder */}
                <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 h-64">
                    <div className="h-4 w-24 bg-white/5 rounded mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-10 w-full bg-white/5 rounded"></div>
                        <div className="h-10 w-full bg-white/5 rounded"></div>
                        <div className="h-10 w-1/3 bg-white/5 rounded"></div>
                    </div>
                </div>
            </main>
        </div>
    );
}
