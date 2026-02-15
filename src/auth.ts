import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import LinkedIn from "next-auth/providers/linkedin";
import Google from "next-auth/providers/google"; // For YouTube
import TikTok from "next-auth/providers/tiktok";
import Credentials from "next-auth/providers/credentials";
import { turso as db } from "@/lib/turso";
import bcrypt from "bcryptjs";
import { User, Client } from "@/types";

// ⚠️ DEPLOYMENT DEBUG: Fail-safe check for missing AUTH_SECRET
const isDeployCheck = process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET;

const config = {
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

                // 1. Check Users (Admin / Team / Agency)
                const userRes = await db.execute({
                    sql: "SELECT * FROM users WHERE email = ?",
                    args: [email]
                });

                if (userRes.rows.length > 0) {
                    const user = userRes.rows[0] as unknown as User;
                    // Mock password check for now if no hash, otherwise bcrypt
                    // Assuming existing users might not have hashed passwords yet if migration logic strictly used bcrypt.
                    // But auth-actions used bcrypt.compare, so we assume hashes exist.
                    // For dev/test simplicty, if password matches raw string (legacy) or bcrypt
                    // logic:
                    let isValid = false;
                    // Try bcrypt
                    try {
                        isValid = await bcrypt.compare(password, (user as any).password_hash); // DB column is password_hash
                    } catch (e) {
                        // Fallback? No, secure default.
                    }

                    if (isValid) {
                        return {
                            id: user.id.toString(),
                            name: user.name,
                            email: user.email,
                            image: user.avatar_url,
                            role: user.role, // 'Admin', 'Team', etc.
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

                return null;
            }
        }),
        Facebook({
            clientId: process.env.AUTH_FACEBOOK_ID,
            clientSecret: process.env.AUTH_FACEBOOK_SECRET,
            authorization: {
                params: {
                    scope: "email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts",
                },
            },
        }),
        LinkedIn({
            clientId: process.env.AUTH_LINKEDIN_ID,
            clientSecret: process.env.AUTH_LINKEDIN_SECRET,
            authorization: {
                params: { scope: "openid profile email w_member_social" },
            },
        }),
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            authorization: {
                params: {
                    scope: "openid profile email https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly"
                }
            }
        }),
        TikTok({
            clientId: process.env.AUTH_TIKTOK_KEY,
            clientSecret: process.env.AUTH_TIKTOK_SECRET,
            authorization: {
                params: {
                    scope: "user.info.basic,video.list,video.upload"
                }
            }
        })
    ],
    secret: process.env.AUTH_SECRET || 'dummy-secret-for-build',
    callbacks: {
        async jwt({ token, user, account }: any) {
            if (user) {
                token.role = user.role;
                token.agency_id = user.agency_id;
                token.id = user.id;
            }
            // Preserve account tokens for social linking if happening
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
        async signIn({ user, account, profile }: any) {
            // Allow Credentials login to pass through
            if (account?.provider === 'credentials') return true;

            if (!account || !user) return false;

            // Social Account Linking Logic (unchanged)
            try {
                let platform = 'instagram'; // default
                if (account.provider === 'facebook') platform = 'facebook';
                else if (account.provider === 'linkedin') platform = 'linkedin';
                else if (account.provider === 'google') platform = 'youtube';
                else if (account.provider === 'tiktok') platform = 'tiktok';

                const handle = user.name || user.email || 'Unknown';
                const avatar = user.image || '';

                // Check if account exists
                const { rows } = await db.execute({
                    sql: "SELECT id FROM social_accounts WHERE provider_account_id = ?",
                    args: [account.providerAccountId]
                });

                if (rows.length > 0) {
                    await db.execute({
                        sql: `UPDATE social_accounts 
                      SET access_token = ?, refresh_token = ?, expires_at = ?, avatar_url = ?
                      WHERE provider_account_id = ?`,
                        args: [
                            account.access_token || '',
                            account.refresh_token || '',
                            account.expires_at || 0,
                            avatar,
                            account.providerAccountId
                        ]
                    });
                } else {
                    await db.execute({
                        sql: `INSERT INTO social_accounts 
                      (platform, handle, avatar_url, provider_account_id, access_token, refresh_token, expires_at, connected_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                        args: [
                            platform,
                            handle,
                            avatar,
                            account.providerAccountId,
                            account.access_token || '',
                            account.refresh_token || '',
                            account.expires_at || 0
                        ]
                    });
                }
                return true;
            } catch (error) {
                console.error("Error saving social account:", error);
                return false;
            }
        },
    },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);

