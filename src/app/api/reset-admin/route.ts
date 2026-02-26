import { turso } from '@/lib/turso';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const email = 'max@defcon.com';
        const rawPassword = 'admin';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        await turso.execute({
            sql: 'UPDATE users SET password_hash = ? WHERE email = ?',
            args: [hashedPassword, email]
        });

        // Test if raw password works too just in case (we use bcrypt in auth)
        return NextResponse.json({ success: true, message: `Password for ${email} has been reset to: ${rawPassword}` });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
