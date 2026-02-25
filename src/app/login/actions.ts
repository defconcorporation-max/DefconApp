'use server';

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function authenticate(prevState: string | undefined, formData: FormData) {
    try {
        await signIn('credentials', {
            ...Object.fromEntries(formData.entries()),
            redirect: true,
            redirectTo: "/"
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        // Next.js 'redirect()' throws an error that MUST be re-thrown
        // to actually perform the redirect. 
        throw error;
    }
}
