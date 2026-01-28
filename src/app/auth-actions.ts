'use server';

import { signIn } from "@/auth";
import { turso as db } from "@/lib/turso";
import bcrypt from 'bcryptjs';
import { encrypt } from "@/lib/auth-utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signInAction(platform: string, clientId?: number) {
    const providerMap: Record<string, string> = {
        instagram: 'facebook',
        facebook: 'facebook',
        linkedin: 'linkedin',
        tiktok: 'tiktok',
        youtube: 'google'
    };

    const provider = providerMap[platform] || 'facebook';
    await signIn(provider, { redirectTo: `/clients/${clientId || ''}` });
}

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { rows } = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email]
    });

    const user = rows[0] as any;

    if (!user) {
        return { error: 'Invalid credentials' };
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
        return { error: 'Invalid credentials' };
    }

    // Create session
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week
    const session = await encrypt({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, expires });

    (await cookies()).set('session', session, { expires, httpOnly: true });

    return { success: true };
}
