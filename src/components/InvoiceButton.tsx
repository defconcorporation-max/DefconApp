'use client';

import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from './pdf/InvoicePDF';
import { Project, Client, ProjectService, Settings } from '@/types';
import { FileText, Download } from 'lucide-react';

interface InvoiceButtonProps {
    project: Project;
    client: Client;
    services: ProjectService[];
    settings: Settings;
    className?: string;
    children?: React.ReactNode;
}

export const InvoiceButton = ({ project, client, services, settings, className, children }: InvoiceButtonProps) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const invoiceNumber = `INV-${project.id}-${new Date().getFullYear()}`;
    const date = new Date().toLocaleDateString();

    const LoadingFallback = () => (
        <button className={className || "flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors opacity-50 cursor-not-allowed"}>
            <FileText size={14} />
            <span>Loading...</span>
        </button>
    );

    if (!isClient) {
        return <LoadingFallback />;
    }

    return (
        <PDFDownloadLink
            document={
                <InvoicePDF
                    project={project}
                    client={client}
                    services={services}
                    settings={settings}
                    invoiceNumber={invoiceNumber}
                    date={date}
                />
            }
            fileName={`Invoice_${project.title.replace(/\s+/g, '_')}.pdf`}
            className={className || "flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors text-decoration-none"}
        >
            {({ blob, url, loading, error }) => (
                loading ? (
                    <span className="flex items-center gap-2">
                        <FileText size={14} /> Generating...
                    </span>
                ) : (
                    children || (
                        <span className="flex items-center gap-2">
                            <Download size={14} /> Download Invoice
                        </span>
                    )
                )
            )}
        </PDFDownloadLink>
    );
};
