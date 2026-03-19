import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = (() => {
    const secret = process.env.AUTH_SECRET;
    if (process.env.NODE_ENV === 'production' && !secret) {
        throw new Error('AUTH_SECRET must be set in production (auth-utils).');
    }
    return secret || 'fallback-secret-key-change-me';
})();
const key = new TextEncoder().encode(SECRET_KEY);

export const SESSION_DURATION = 60 * 60 * 24 * 7; // 1 week

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
