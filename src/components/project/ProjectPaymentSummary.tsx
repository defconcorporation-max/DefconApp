'use client';

import { useMemo, useState } from 'react';
import { DollarSign, ArrowUpRight } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

export default function ProjectPaymentSummary({
  project,
  clientId,
  totalIncTax,
  paidAmount,
}: {
  project: { id: number; title: string };
  clientId: number;
  totalIncTax: number;
  paidAmount: number;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { balance, isPaidOff } = useMemo(() => {
    const bal = Math.max(0, (totalIncTax || 0) - (paidAmount || 0));
    return { balance: bal, isPaidOff: bal <= 0.01 && (totalIncTax || 0) > 0 };
  }, [totalIncTax, paidAmount]);

  return (
    <div className="pro-card-hero">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="section-label mb-2 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-400" />
            Encaissement
          </h3>
          <div className="text-sm text-[var(--text-tertiary)]">Total facturé (incl. taxes)</div>
          <div className="text-2xl font-bold text-white tabular-nums">
            ${Number(totalIncTax || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Paid</div>
          <div className="font-mono text-white tabular-nums">
            ${Number(paidAmount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>

          <div className="mt-3 text-xs uppercase tracking-wider text-[var(--text-tertiary)]">Balance</div>
          <div
            className={`font-mono tabular-nums ${
              isPaidOff ? 'text-emerald-400' : 'text-[var(--text-secondary)]'
            }`}
          >
            ${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {balance > 0.01 && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-colors"
          >
            <ArrowUpRight size={14} />
            Enregistrer un paiement
          </button>
        </div>
      )}

      {isModalOpen && (
        <PaymentModal
          project={project}
          clientId={clientId}
          balance={balance}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

