'use server';

import { cookies } from 'next/headers';
import { encrypt, SESSION_DURATION } from '@/lib/auth-utils';
import { turso as db } from '@/lib/turso';
import bcrypt from 'bcryptjs';

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Verify User
    const { rows } = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email]
    });
    const user = rows[0] as any;

    if (!user) return { error: 'Invalid credentials' };

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return { error: 'Invalid credentials' };

    // Create Session
    const expires = new Date(Date.now() + SESSION_DURATION * 1000);
    const session = await encrypt({ user: { id: user.id, email: user.email, name: user.name }, expires });

    (await cookies()).set('session', session, { expires, httpOnly: true });

    return { success: true };
}

export async function logout() {
    (await cookies()).set('session', '', { expires: new Date(0) });
}
