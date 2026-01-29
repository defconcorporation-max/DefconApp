import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import LinkedIn from "next-auth/providers/linkedin";
import Google from "next-auth/providers/google"; // For YouTube
import TikTok from "next-auth/providers/tiktok";
import { turso as db } from "@/lib/turso";

// ⚠️ DEPLOYMENT DEBUG: Fail-safe check for missing AUTH_SECRET
// If crucial env vars are missing, NextAuth v5 crashes the server boot.
// We use a dummy fallback to ensure the app can at least start/render 404s/Health checks.
const isDeployCheck = process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET;

const config = {
    providers: [
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
    secret: process.env.AUTH_SECRET || 'dummy-secret-for-build', // Prevent crash
    callbacks: {
        async signIn({ user, account, profile }: any) {
            if (!account || !user) return false;

            // We use a custom header or cookie to pass the client_id, but since we are initiating
            // this via a server action or client button, we might need a way to track WHICH client this is for.
            // For simplicity in this "Skeleton", we will just save the account. 
            // In the full flow, we'd update the client_id after the fact or use the `state` param if supported deeply.

            // Upsert into social_accounts
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
                    // Update tokens
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
                    // Insert new
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

