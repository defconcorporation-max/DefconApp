'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { SalesPlaybook } from '@/components/pdf/SalesPlaybook';
import { Download, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SalesPlaybookButton() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <button disabled className="w-full flex items-center justify-between p-6 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl opacity-50 cursor-not-allowed">
                <div className="flex flex-col items-start text-left">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <FileText size={20} className="text-indigo-400" />
                        Sales Playbook
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">Loading PDF generator...</p>
                </div>
                <Download size={24} className="text-[var(--text-tertiary)]" />
            </button>
        );
    }

    return (
        <PDFDownloadLink
            document={<SalesPlaybook />}
            fileName="Defcon_Sales_Playbook.pdf"
            className="w-full block"
        >
            {({ blob, url, loading, error }) => (
                <div className="w-full flex items-center justify-between p-6 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group cursor-pointer h-full">
                    <div className="flex flex-col items-start text-left">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
                            <FileText size={20} className="text-indigo-500" />
                            Sales Playbook
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {loading ? 'Generating PDF...' : 'Download the official sales training guide & pricing.'}
                        </p>
                    </div>
                    <div className="bg-[var(--bg-root)] p-3 rounded-full border border-[var(--border-subtle)] group-hover:border-indigo-500/30 transition-all">
                        <Download size={24} className="text-[var(--text-secondary)] group-hover:text-indigo-400 transition-colors" />
                    </div>
                </div>
            )}
        </PDFDownloadLink>
    );
}
