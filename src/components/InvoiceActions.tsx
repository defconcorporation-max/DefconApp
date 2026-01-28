'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Send, CheckCircle, Clock, Printer } from 'lucide-react';
import { sendInvoiceEmail, updateInvoiceStatus } from '@/app/invoice-actions';

interface InvoiceActionsProps {
    projectId: number;
    clientEmail: string;
    currentStatus: string;
    sentAt: string | null;
}

export default function InvoiceActions({ projectId, clientEmail, currentStatus, sentAt }: InvoiceActionsProps) {
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState(currentStatus);

    const handleSend = async () => {
        if (!clientEmail) {
            alert('Client has no email address.');
            return;
        }
        if (!confirm(`Send invoice to ${clientEmail}?`)) return;

        setSending(true);
        await sendInvoiceEmail(projectId, clientEmail);
        setStatus('Sent');
        setSending(false);
        alert('Invoice sent successfully!');
    };

    const handleMarkPaid = async () => {
        await updateInvoiceStatus(projectId, 'Paid');
        setStatus('Paid');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-8 no-print">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Status</span>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant={status === 'Paid' ? 'success' : status === 'Sent' ? 'warning' : 'outline'}>
                            {status}
                        </Badge>
                        {sentAt && status === 'Sent' && (
                            <span className="text-xs text-[var(--text-tertiary)] ml-2">
                                Sent on {new Date(sentAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <Button variant="ghost" size="sm" onClick={handlePrint}>
                    <Printer size={16} className="mr-2" />
                    Print / PDF
                </Button>

                {status !== 'Paid' && (
                    <Button variant="secondary" size="sm" onClick={handleMarkPaid}>
                        <CheckCircle size={16} className="mr-2" />
                        Mark Paid
                    </Button>
                )}

                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSend}
                    disabled={sending}
                >
                    <Send size={16} className={`mr-2 ${sending ? 'animate-pulse' : ''}`} />
                    {sending ? 'Sending...' : 'Email Invoice'}
                </Button>
            </div>
        </div>
    );
}
