import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { turso as db } from './turso';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.AUTH_SECRET || 'fallback-secret-key-change-me';
const key = new TextEncoder().encode(SECRET_KEY);

const SESSION_DURATION = 60 * 60 * 24 * 7; // 1 week

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1 week')
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch {
        return null;
    }
}

export async function getSession() {
    const session = (await cookies()).get('session')?.value;
    if (!session) return null;
    return await decrypt(session);
}

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
