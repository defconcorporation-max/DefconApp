export async function publishToFacebook(accessToken: string, content: string, mediaUrl?: string) {
    // Facebook Page Post
    // Endpoint: POST /{page-id}/feed (text) or /{page-id}/photos (image)
    // We assume the token is a Page Access Token.

    const baseUrl = 'https://graph.facebook.com/v19.0/me';
    let url = `${baseUrl}/feed`;
    const params = new URLSearchParams({ access_token: accessToken });

    if (mediaUrl) {
        url = `${baseUrl}/photos`;
        params.append('url', mediaUrl);
        params.append('caption', content);
    } else {
        params.append('message', content);
    }

    const res = await fetch(`${url}?${params.toString()}`, { method: 'POST' });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error?.message || 'Facebook publish failed');
    return data.id;
}

export async function publishToInstagram(accessToken: string, content: string, mediaUrl: string) {
    // Instagram Graph API
    // 1. Create Media Container: POST /{ig-user-id}/media
    // 2. Publish Container: POST /{ig-user-id}/media_publish

    if (!mediaUrl) throw new Error('Instagram requires an image');

    const baseUrl = 'https://graph.facebook.com/v19.0/me'; // We assume 'me' maps to the IG Business Account if token is scoped correctly

    // Step 1: Create Container
    const containerParams = new URLSearchParams({
        access_token: accessToken,
        image_url: mediaUrl,
        caption: content
    });

    const containerRes = await fetch(`${baseUrl}/media?${containerParams.toString()}`, { method: 'POST' });
    const containerData = await containerRes.json();

    if (!containerRes.ok) throw new Error(containerData.error?.message || 'Instagram container creation failed');

    const creationId = containerData.id;

    // Step 2: Publish
    const publishParams = new URLSearchParams({
        access_token: accessToken,
        creation_id: creationId
    });

    const publishRes = await fetch(`${baseUrl}/media_publish?${publishParams.toString()}`, { method: 'POST' });
    const publishData = await publishRes.json();

    if (!publishRes.ok) throw new Error(publishData.error?.message || 'Instagram publish failed');

    return publishData.id;
}

export async function publishToLinkedIn(accessToken: string, content: string, mediaUrl?: string, authorUrn?: string) {
    // LinkedIn UGC API

    const body: any = {
        author: authorUrn || `urn:li:person:UNKNOWN`, // Ideally we store the URN in the DB
        lifecycleState: "PUBLISHED",
        specificContent: {
            "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                    text: content
                },
                shareMediaCategory: "NONE"
            }
        },
        visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    if (mediaUrl) {
        // Logic for media upload is complex (Register -> Upload -> Verify -> Post).
        // V1: Just share as article/link if it's a URL, or skip rich media for now.
        // Or simple text link in body.
        body.specificContent["com.linkedin.ugc.ShareContent"].shareCommentary.text += `\n\n${mediaUrl}`;
    }

    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'LinkedIn publish failed');

    return data.id;
}

export async function publishToTikTok(accessToken: string, content: string, mediaUrl: string) {
    // TikTok Video Kit
    // Requires binary upload often.
    // For V1 placeholder.
    if (!accessToken) throw new Error("No Access Token");
    // Simulate
    return "mock_tiktok_id";
}

export async function publishToYouTube(accessToken: string, content: string, mediaUrl: string) {
    // YouTube Data API
    // Videos.insert requires multipart upload.
    // For V1 placeholder.
    if (!accessToken) throw new Error("No Access Token");
    // Simulate
    return "mock_youtube_id";
}
