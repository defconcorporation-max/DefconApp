import { NextResponse } from 'next/server';
import { notFoundInProduction } from '@/lib/api-dev-only';

export const dynamic = 'force-dynamic';

export async function GET() {
    const blocked = notFoundInProduction();
    if (blocked) return blocked;
    return NextResponse.json({ message: 'App Router is working!' });
}
