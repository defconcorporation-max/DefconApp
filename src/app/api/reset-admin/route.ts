import { turso } from '@/lib/turso';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const rawPassword = 'admin';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // Fetch all users
        const usersRes = await turso.execute('SELECT id, email, name, role FROM users');
        const users = usersRes.rows;

        // Reset them all to admin
        await turso.execute({
            sql: 'UPDATE users SET password_hash = ?',
            args: [hashedPassword]
        });

        return NextResponse.json({
            success: true,
            message: `Password has been reset to: ${rawPassword} for all users.`,
            users: users
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
