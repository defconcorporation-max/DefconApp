import { NextResponse } from 'next/server';

/**
 * Blocks migration / schema-fix / debug API routes in production.
 * Returns 404 to avoid advertising that the endpoint exists.
 */
export function notFoundInProduction(): NextResponse | null {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return null;
}
