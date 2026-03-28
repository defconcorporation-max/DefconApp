import type { NextAuthConfig } from "next-auth";
import Facebook from "next-auth/providers/facebook";
import LinkedIn from "next-auth/providers/linkedin";
import Google from "next-auth/providers/google";
import TikTok from "next-auth/providers/tiktok";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
    providers: [
        // Placeholder for Credentials (logic belongs in auth.ts)
        Credentials({
            authorize: async () => null,
        }),
        Facebook({
            clientId: process.env.AUTH_FACEBOOK_ID,
            clientSecret: process.env.AUTH_FACEBOOK_SECRET,
        }),
        LinkedIn({
            clientId: process.env.AUTH_LINKEDIN_ID,
            clientSecret: process.env.AUTH_LINKEDIN_SECRET,
        }),
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        TikTok({
            clientId: process.env.AUTH_TIKTOK_KEY,
            clientSecret: process.env.AUTH_TIKTOK_SECRET,
        })
    ],
    secret: process.env.AUTH_SECRET || 'dummy-secret',
    callbacks: {
        async jwt({ token, user, account }: any) {
            if (user) {
                token.role = user.role;
                token.agency_id = user.agency_id;
                token.id = user.id;
            }
            if (account && account.provider !== 'credentials') {
                token[`${account.provider}_access_token`] = account.access_token;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.agency_id = token.agency_id;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    }
};
