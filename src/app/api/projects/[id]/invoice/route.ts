import { NextResponse } from 'next/server';
import { turso as db } from '@/lib/turso';
import { auth } from '@/auth';
import { subtotalPreTaxFromLines, taxAmountsFromSubtotal, totalIncTaxFromSubtotal } from '@/lib/finance/tax';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const session = await auth();

    if (!session || (session.user?.role !== 'Admin' && session.user?.role !== 'Team')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const projectId = parseInt(id, 10);

        const [projectRes, shootsRes, servicesRes, settingsRes] = await Promise.all([
            db.execute({
                sql: `
                SELECT p.*, c.name as client_name, c.company_name, c.email
                FROM projects p
                LEFT JOIN clients c ON p.client_id = c.id
                WHERE p.id = ?
            `,
                args: [projectId],
            }),
            db.execute({
                sql: 'SELECT id, title, shoot_date, estimated_hours, actual_revenue FROM shoots WHERE project_id = ? ORDER BY shoot_date ASC',
                args: [projectId],
            }),
            db.execute({
                sql: 'SELECT id, name, rate, quantity FROM project_services WHERE project_id = ? ORDER BY id ASC',
                args: [projectId],
            }),
            db.execute({
                sql: 'SELECT tax_tps_rate, tax_tvq_rate FROM settings WHERE id = 1',
                args: [],
            }),
        ]);

        if (projectRes.rows.length === 0) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const project = projectRes.rows[0] as Record<string, unknown>;
        const shoots = shootsRes.rows as Record<string, unknown>[];
        const services = servicesRes.rows as Record<string, unknown>[];
        const rawSettings = settingsRes.rows[0] as Record<string, unknown> | undefined;

        const tpsRate = Number(rawSettings?.tax_tps_rate ?? 5);
        const tvqRate = Number(rawSettings?.tax_tvq_rate ?? 9.975);

        const useServices = services.length > 0;

        const line_items = useServices
            ? services.map((s) => {
                  const rate = Number(s.rate) || 0;
                  const qty = Number(s.quantity) || 0;
                  return {
                      description: String(s.name ?? 'Service'),
                      quantity: qty,
                      unit_price: rate,
                      amount: rate * qty,
                  };
              })
            : shoots.map((shoot) => {
                  const revenue = Number(shoot.actual_revenue) || 0;
                  const hours = Number(shoot.estimated_hours) || 1;
                  return {
                      description: `Shoot: ${shoot.title} (${shoot.shoot_date})`,
                      quantity: hours,
                      unit_price: revenue / hours,
                      amount: revenue,
                  };
              });

        const subtotalPreTax = useServices
            ? subtotalPreTaxFromLines(services.map((s) => ({ rate: s.rate, quantity: s.quantity })))
            : shoots.reduce((sum, shoot) => sum + (Number(shoot.actual_revenue) || 0), 0);

        const { tps, tvq } = taxAmountsFromSubtotal(subtotalPreTax, tpsRate, tvqRate);
        const taxTotal = tps + tvq;
        const totalDue = totalIncTaxFromSubtotal(subtotalPreTax, tpsRate, tvqRate);

        const invoicePayload = {
            invoice_number: `INV-DEFCON-${project.id}-${new Date().getFullYear()}`,
            issue_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: project.status === 'Completed' ? 'PAID' : 'DRAFT',
            customer: {
                name: project.client_name,
                company: project.company_name,
                email: project.email || '',
            },
            project: {
                id: project.id,
                title: project.title,
                summary: project.summary,
            },
            line_items,
            line_item_source: useServices ? 'project_services' : 'shoots',
            totals: {
                /** Montants avant taxes (TPS/TVQ Québec) */
                subtotal_pre_tax: subtotalPreTax,
                /** Alias rétrocompat — identique à subtotal_pre_tax */
                subtotal: subtotalPreTax,
                tps,
                tvq,
                tax_total: taxTotal,
                /** Alias pour intégrations qui attendent un seul champ « tax » */
                tax: taxTotal,
                total_due: totalDue,
                tax_rates_percent: {
                    tps: tpsRate,
                    tvq: tvqRate,
                },
            },
            metadata: {
                generated_by: session.user?.name,
                system: 'Defcon App',
                currency: 'CAD',
            },
        };

        return NextResponse.json(invoicePayload);
    } catch (e) {
        console.error('Invoice Generation Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
