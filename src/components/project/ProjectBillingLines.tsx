'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';
import { addProjectService, deleteProjectService } from '@/lib/actions/project-services';
import type { ProjectService, Service } from '@/types';

type Row = ProjectService | (Record<string, unknown> & { id: number; name: string; rate: number; quantity: number });

export default function ProjectBillingLines({
  projectId,
  initialLines,
  catalog,
}: {
  projectId: number;
  initialLines: Row[];
  catalog: Service[];
}) {
  const router = useRouter();
  const [lines, setLines] = useState<Row[]>(initialLines);
  const [isPending, startTransition] = useTransition();
  const [pickServiceId, setPickServiceId] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [customRate, setCustomRate] = useState('');
  const [customQty, setCustomQty] = useState('1');

  useEffect(() => {
    setLines(initialLines);
  }, [initialLines]);

  const subtotal = lines.reduce((s, l) => s + (Number(l.rate) || 0) * (Number(l.quantity) || 0), 0);

  const onDelete = (row: Row) => {
    const id = row.id;
    const fd = new FormData();
    fd.set('id', String(id));
    fd.set('projectId', String(projectId));
    startTransition(async () => {
      await deleteProjectService(fd);
      setLines((prev) => prev.filter((x) => x.id !== id));
    });
  };

  const onAddFromCatalog = () => {
    const sid = Number(pickServiceId);
    const svc = catalog.find((c) => c.id === sid);
    if (!svc) return;
    const fd = new FormData();
    fd.set('projectId', String(projectId));
    fd.set('name', svc.name);
    fd.set('rate', String(svc.default_rate ?? 0));
    fd.set('quantity', '1');
    fd.set('serviceId', String(svc.id));
    startTransition(async () => {
      await addProjectService(fd);
      router.refresh();
    });
  };

  const onAddCustom = () => {
    const name = customName.trim();
    const rate = Number(customRate);
    const quantity = Number(customQty) || 1;
    if (!name || !Number.isFinite(rate)) return;
    const fd = new FormData();
    fd.set('projectId', String(projectId));
    fd.set('name', name);
    fd.set('rate', String(rate));
    fd.set('quantity', String(quantity));
    startTransition(async () => {
      await addProjectService(fd);
      setCustomName('');
      setCustomRate('');
      setCustomQty('1');
      router.refresh();
    });
  };

  return (
    <div className="pro-dashboard-card p-6 rounded-2xl space-y-4">
      <div>
        <h3 className="section-label mb-1">Lignes de facturation</h3>
        <p className="text-xs text-[var(--text-tertiary)]">
          Montants saisis en <span className="text-[var(--text-secondary)] font-medium">HT</span> (taxes appliquées sur la facture PDF).
        </p>
      </div>

      {lines.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] py-4">Aucune ligne — ajoutez un service du catalogue ou une ligne libre.</p>
      ) : (
        <ul className="space-y-2">
          {lines.map((line) => {
            const lineTotal = (Number(line.rate) || 0) * (Number(line.quantity) || 0);
            return (
              <li
                key={line.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#0A0A0A] border border-[var(--border-subtle)] text-sm"
              >
                <div>
                  <div className="font-medium text-white">{String(line.name)}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {Number(line.quantity) || 0} × ${Number(line.rate).toLocaleString()} ={' '}
                    <span className="text-emerald-400 font-mono">${lineTotal.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onDelete(line)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors disabled:opacity-50"
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-between text-sm">
        <span className="text-[var(--text-tertiary)]">Sous-total HT</span>
        <span className="font-mono font-bold text-white">${subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 p-4 rounded-xl bg-black/30 border border-[var(--border-subtle)]">
          <div className="text-xs font-bold text-[var(--text-tertiary)] uppercase">Depuis le catalogue</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={pickServiceId}
              onChange={(e) => setPickServiceId(e.target.value)}
              className="flex-1 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">Choisir un service…</option>
              {catalog.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (${Number(s.default_rate).toLocaleString()})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isPending || !pickServiceId}
              onClick={onAddFromCatalog}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-sm font-medium hover:bg-indigo-500/30 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>

        <div className="space-y-2 p-4 rounded-xl bg-black/30 border border-[var(--border-subtle)]">
          <div className="text-xs font-bold text-[var(--text-tertiary)] uppercase">Ligne libre (HT)</div>
          <div className="grid grid-cols-1 gap-2">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Description"
              className="bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--text-tertiary)]"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                step="0.01"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                placeholder="Tarif unitaire"
                className="flex-1 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[var(--text-tertiary)]"
              />
              <input
                type="number"
                min={1}
                step="1"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="Qté"
                className="w-20 bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={onAddCustom}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-sm font-medium hover:bg-emerald-500/25 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" /> Ajouter la ligne
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
