import { NextRequest, NextResponse } from 'next/server';
import { turso as db } from '@/lib/turso';
import { publishToFacebook, publishToInstagram, publishToLinkedIn, publishToTikTok, publishToYouTube } from '@/lib/social-service';

// Force dynamic execution so it checks time correctly
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // 1. Security Check
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log('--- Cron: Social Auto-Publisher Started ---');

        // 2. Fetch Due Posts
        // SQLite: datetime('now') is UTC. Ensure apps store UTC or handle offset.
        // We assume scheduled_date is ISO string or compatible.
        const { rows: posts } = await db.execute(`
            SELECT p.*, a.platform, a.access_token, a.provider_account_id 
            FROM social_posts p
            JOIN social_accounts a ON p.account_id = a.id
            WHERE p.status = 'Scheduled' 
            AND datetime(p.scheduled_date) <= datetime('now')
        `);

        if (posts.length === 0) {
            console.log('No due posts found.');
            return NextResponse.json({ success: true, count: 0 });
        }

        console.log(`Found ${posts.length} due posts.`);

        const results = [];

        // 3. Process Each Post
        for (const post of posts as any[]) {
            try {
                let externalId = '';

                // Skip if no token (simulated account)
                if (!post.access_token) {
                    console.log(`Skipping post ${post.id}: No access token (Simulated Account).`);
                    // Optionally mark as Failed or Published-Simulated
                    // For now, let's mark as Published to clear the queue
                    await db.execute({
                        sql: "UPDATE social_posts SET status = 'Published' WHERE id = ?",
                        args: [post.id]
                    });
                    results.push({ id: post.id, status: 'Published (Simulated)' });
                    continue;
                }

                // Real Publish
                switch (post.platform) {
                    case 'facebook':
                        externalId = await publishToFacebook(post.access_token, post.content, post.media_url);
                        break;
                    case 'instagram':
                        externalId = await publishToInstagram(post.access_token, post.content, post.media_url);
                        break;
                    case 'linkedin':
                        externalId = await publishToLinkedIn(post.access_token, post.content, post.media_url, post.provider_account_id);
                        break;
                    case 'tiktok':
                        externalId = await publishToTikTok(post.access_token, post.content, post.media_url);
                        break;
                    case 'youtube':
                        externalId = await publishToYouTube(post.access_token, post.content, post.media_url);
                        break;
                    default:
                        throw new Error(`Unsupported platform: ${post.platform}`);
                }

                // Update Status
                await db.execute({
                    sql: "UPDATE social_posts SET status = 'Published' WHERE id = ?",
                    args: [post.id]
                });

                console.log(`Successfully published post ${post.id} to ${post.platform}. ID: ${externalId}`);
                results.push({ id: post.id, status: 'Published', externalId });

            } catch (error: any) {
                console.error(`Failed to publish post ${post.id}:`, error);
                // Mark as Failed so we don't retry indefinitely in a loop
                await db.execute({
                    sql: "UPDATE social_posts SET status = 'Failed' WHERE id = ?",
                    args: [post.id]
                });
                results.push({ id: post.id, status: 'Failed', error: error.message });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('Cron job fatal error:', error);
        return new NextResponse(error.message, { status: 500 });
    }
}
