
import { getProjectById, getProjectServices, getClient, getSettings } from '@/app/actions';
import { Project, ProjectService } from '@/types';
import Link from 'next/link';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const projectId = Number(id);
    const project = await getProjectById(projectId) as Project;

    if (!project) return <div>Project not found</div>;

    const client = await getClient(project.client_id);
    const services = await getProjectServices(projectId) as ProjectService[];
    const settings = await getSettings();

    // Calculations
    const tpsRate = settings?.tax_tps_rate || 5;
    const tvqRate = settings?.tax_tvq_rate || 9.975;

    const subtotal = services.reduce((acc, curr) => acc + (curr.rate * curr.quantity), 0);
    const tpsAmount = subtotal * (tpsRate / 100);
    const tvqAmount = subtotal * (tvqRate / 100);
    const total = subtotal + tpsAmount + tvqAmount;

    const today = new Date().toLocaleDateString('fr-CA'); // ISO-like format YYYY-MM-DD usually preferred or local

    return (
        <main className="min-h-screen bg-white text-black p-8 md:p-16 font-sans">
            {/* Print-only CSS to hide non-print elements if any, though entire page is invoice */}
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-start mb-16 no-print">
                    <Link href={`/projects/${projectId}`} className="text-sm text-gray-500 hover:text-black transition-colors">
                        ← Back to Project
                    </Link>
                    {/* Print Button is handled by the floating action button */}
                </div>

                {/* Invoice Header */}
                <header className="flex justify-between items-start mb-12">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">INVOICE</h1>
                        <p className="text-sm text-gray-500">#{projectId.toString().padStart(4, '0')}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold">DEFCON AGENCY</h2>
                        <p className="text-sm text-gray-500">Montreal, QC</p>
                        <p className="text-sm text-gray-500">contact@defcon.ca</p>
                    </div>
                </header>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8 mb-16">
                    <div>
                        <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Bill To</h3>
                        <div className="text-lg font-bold">{client?.company_name}</div>
                        <div className="text-gray-600">{client?.name}</div>
                    </div>
                    <div className="text-right">
                        <div className="mb-4">
                            <h3 className="text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider">Date</h3>
                            <div className="text-lg font-mono">{today}</div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider">Project</h3>
                            <div className="text-lg">{project.title}</div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="mb-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="py-3 text-xs font-bold uppercase tracking-wider">Description</th>
                                <th className="py-3 text-xs font-bold uppercase tracking-wider text-right">Qty</th>
                                <th className="py-3 text-xs font-bold uppercase tracking-wider text-right">Rate</th>
                                <th className="py-3 text-xs font-bold uppercase tracking-wider text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {services.map(service => (
                                <tr key={service.id}>
                                    <td className="py-4 font-medium">{service.name}</td>
                                    <td className="py-4 text-right text-gray-600">{service.quantity}</td>
                                    <td className="py-4 text-right text-gray-600">${service.rate.toLocaleString()}</td>
                                    <td className="py-4 text-right font-mono font-bold">${(service.rate * service.quantity).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 text-sm">
                            <span>TPS ({tpsRate}%)</span>
                            <span>${tpsAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 text-sm">
                            <span>TVQ ({tvqRate}%)</span>
                            <span>${tvqAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl border-t-2 border-black pt-4 mt-4">
                            <span>Total</span>
                            <span>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-24 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
                    <p>Thank you for your business.</p>
                </footer>
            </div>



            <PrintButton />
        </main >
    );
}

// Client Component for Print Button
import PrintButton from '@/components/PrintButton';
