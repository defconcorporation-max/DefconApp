import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import LinkedIn from "next-auth/providers/linkedin";
import { turso as db } from "@/lib/turso";

export const { handlers, signIn, signOut, auth } = NextAuth({
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
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!account || !user) return false;

            // We use a custom header or cookie to pass the client_id, but since we are initiating
            // this via a server action or client button, we might need a way to track WHICH client this is for.
            // For simplicity in this "Skeleton", we will just save the account. 
            // In the full flow, we'd update the client_id after the fact or use the `state` param if supported deeply.

            // Upsert into social_accounts
            try {
                const platform = account.provider === 'facebook' ? 'facebook' :
                    account.provider === 'linkedin' ? 'linkedin' : 'instagram';

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
});
