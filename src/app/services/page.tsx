import { getServices, createService, deleteService } from '@/app/actions';
import { Service } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';

export default async function ServicesPage() {
    const services = await getServices() as Service[];

    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <header className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-medium tracking-tight">Services Catalog</h1>
                </div>
            </header>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Add Service Form */}
                <div className="md:col-span-1">
                    <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-6 sticky top-8">
                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Plus size={18} className="text-violet-400" />
                            New Service
                        </h2>
                        <form action={createService} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Service Name</label>
                                <input name="name" type="text" placeholder="e.g. Drone Piloting" className="pro-input w-full" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Default Rate ($)</label>
                                <input name="rate" type="number" step="0.01" placeholder="0.00" className="pro-input w-full" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Rate Type</label>
                                <select name="type" className="bg-[#121212] border border-[var(--border-subtle)] rounded px-2 py-2 text-sm text-white w-full outline-none focus:border-violet-500">
                                    <option value="Fixed">Fixed Price</option>
                                    <option value="Hourly">Per Hour</option>
                                    <option value="Day">Per Day</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-2 rounded-lg transition-colors mt-2">
                                Add Service
                            </button>
                        </form>
                    </div>
                </div>

                {/* Services List */}
                <div className="md:col-span-2 space-y-4">
                    {services.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl border-dashed">
                            No services defined yet.
                        </div>
                    ) : (
                        services.map(service => (
                            <div key={service.id} className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-4 flex items-center justify-between group hover:border-violet-500/30 transition-colors">
                                <div>
                                    <h3 className="font-medium text-white text-lg">{service.name}</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        ${service.default_rate} <span className="text-[var(--text-tertiary)]">/ {service.rate_type}</span>
                                    </p>
                                </div>
                                <form action={deleteService.bind(null, service.id)}>
                                    <button type="submit" className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </form>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
