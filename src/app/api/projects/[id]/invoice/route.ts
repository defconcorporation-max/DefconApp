import { NextResponse } from 'next/server';
import { turso as db } from '@/lib/turso';
import { auth } from '@/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    // Allow basic security check
    if (!session || (session.user?.role !== 'Admin' && session.user?.role !== 'Team')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const projectId = parseInt(id);

        // Fetch project and client
        const projectRes = await db.execute({
            sql: `
                SELECT p.*, c.name as client_name, c.company_name, c.email
                FROM projects p 
                LEFT JOIN clients c ON p.client_id = c.id
                WHERE p.id = ?
            `,
            args: [projectId]
        });

        if (projectRes.rows.length === 0) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const project = projectRes.rows[0] as any;

        // Fetch all shoots for line items
        const shootsRes = await db.execute({
            sql: 'SELECT id, title, shoot_date, estimated_hours, actual_revenue FROM shoots WHERE project_id = ? ORDER BY shoot_date ASC',
            args: [projectId]
        });

        const shoots = shootsRes.rows as any[];

        // Construct the Invoice payload
        // This is a typical schema an external accounting software might expect
        const invoicePayload = {
            invoice_number: `INV-DEFCON-${project.id}-${new Date().getFullYear()}`,
            issue_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Net 30
            status: project.status === 'Completed' ? 'PAID' : 'DRAFT',
            customer: {
                name: project.client_name,
                company: project.company_name,
                email: project.email || ''
            },
            project: {
                id: project.id,
                title: project.title,
                summary: project.summary
            },
            line_items: shoots.map(shoot => ({
                description: `Shoot: ${shoot.title} (${shoot.shoot_date})`,
                quantity: shoot.estimated_hours || 1,
                unit_price: (shoot.actual_revenue || 0) / (shoot.estimated_hours || 1),
                amount: shoot.actual_revenue || 0
            })),
            totals: {
                subtotal: project.total_revenue || 0,
                tax: 0, // Assume VAT/Tax is handled separately or 0 for now
                total_due: project.total_revenue || 0
            },
            metadata: {
                generated_by: session.user?.name,
                system: 'Defcon App'
            }
        };

        return NextResponse.json(invoicePayload);
    } catch (e) {
        console.error('Invoice Generation Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
