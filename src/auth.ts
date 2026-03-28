import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import LinkedIn from "next-auth/providers/linkedin";
import Google from "next-auth/providers/google";
import TikTok from "next-auth/providers/tiktok";
import { turso as db } from "@/lib/turso";
import bcrypt from "bcryptjs";
import { User, Client } from "@/types";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                const email = credentials.email as string;
                const password = credentials.password as string;

                try {
                    // 1. Check Users (Admin / Team / Agency)
                    const userRes = await db.execute({
                        sql: "SELECT * FROM users WHERE email = ?",
                        args: [email]
                    });

                    if (userRes.rows.length > 0) {
                        const user = userRes.rows[0] as unknown as User;
                        const isValid = await bcrypt.compare(password, (user as any).password_hash);
                        if (isValid) {
                            return {
                                id: user.id.toString(),
                                name: user.name,
                                email: user.email,
                                image: user.avatar_url,
                                role: user.role,
                                agency_id: user.agency_id
                            };
                        }
                    }

                    // 2. Check Clients (Portal Access)
                    const clientRes = await db.execute({
                        sql: "SELECT * FROM clients WHERE email = ?",
                        args: [email]
                    });

                    if (clientRes.rows.length > 0) {
                        const client = clientRes.rows[0] as unknown as Client;
                        if (client.portal_enabled && client.password_hash) {
                            const isValid = await bcrypt.compare(password, client.password_hash);
                            if (isValid) {
                                return {
                                    id: client.id.toString(),
                                    name: client.name,
                                    email: client.email,
                                    image: client.avatar_url,
                                    role: 'Client',
                                    agency_id: client.agency_id
                                };
                            }
                        }
                    }
                } catch (e) {
                    console.error("Authorize error", e);
                }
                return null;
            }
        }),
        Facebook({
            clientId: process.env.AUTH_FACEBOOK_ID,
            clientSecret: process.env.AUTH_FACEBOOK_SECRET,
            authorization: { params: { scope: "email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts" } },
        }),
        LinkedIn({
            clientId: process.env.AUTH_LINKEDIN_ID,
            clientSecret: process.env.AUTH_LINKEDIN_SECRET,
            authorization: { params: { scope: "openid profile email w_member_social" } },
        }),
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            authorization: { params: { scope: "openid profile email https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly" } }
        }),
        TikTok({
            clientId: process.env.AUTH_TIKTOK_KEY,
            clientSecret: process.env.AUTH_TIKTOK_SECRET,
            authorization: { params: { scope: "user.info.basic,video.list,video.upload" } }
        })
    ],
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account }: any) {
            if (account?.provider === 'credentials') return true;
            if (!account || !user) return false;

            try {
                let platform = 'instagram';
                if (account.provider === 'facebook') platform = 'facebook';
                else if (account.provider === 'linkedin') platform = 'linkedin';
                else if (account.provider === 'google') platform = 'youtube';
                else if (account.provider === 'tiktok') platform = 'tiktok';

                const avatar = user.image || '';
                const { rows } = await db.execute({
                    sql: "SELECT id FROM social_accounts WHERE provider_account_id = ?",
                    args: [account.providerAccountId]
                });

                if (rows.length > 0) {
                    await db.execute({
                        sql: `UPDATE social_accounts SET access_token = ?, refresh_token = ?, expires_at = ?, avatar_url = ? WHERE provider_account_id = ?`,
                        args: [account.access_token || '', account.refresh_token || '', account.expires_at || 0, avatar, account.providerAccountId]
                    });
                } else {
                    await db.execute({
                        sql: `INSERT INTO social_accounts (platform, handle, avatar_url, provider_account_id, access_token, refresh_token, expires_at, connected_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                        args: [platform, user.name || user.email || 'Unknown', avatar, account.providerAccountId, account.access_token || '', account.refresh_token || '', account.expires_at || 0]
                    });
                }
                return true;
            } catch (error) {
                console.error("Error saving social account:", error);
                return false;
            }
        },
    },
});
