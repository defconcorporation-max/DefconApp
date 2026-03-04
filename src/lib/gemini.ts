import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface SocialMediaInsight {
    platform: string;
    url: string;
    followers?: string;
    postsCount?: string;
    verdict: string;
    contentType?: string;
    postingSchedule?: 'Active' | 'Inconsistent' | 'Ghost' | 'Could not determine';
    contentStyle?: 'UGC' | 'Professional' | 'Sales-heavy' | 'Informational' | 'Could not determine';
    score: number;
    contentIdeas?: string[];
    contentMix?: string; // New: e.g. "3:1 Photo/Video"
    lastPostRecency?: string; // New: e.g. "12 weeks ago"
}

export interface ClientAnalysis {
    summary: string;
    brandVibe: string; // New: Tone and aesthetic of the business
    painPoints: string[];
    suggestions: string[];
    qualificationScore: number;
    techStack?: {  // New: Tech Stack found
        cms: string[];
        analytics: string[];
        pixels: string[];
    };
    competitors?: any[]; // New: Competitor insights
    emailDraft: string;
    socialMedia?: {
        overallVerdict: string;
        contentStrategy: string; // New: High-level strategy advice
        insights: SocialMediaInsight[];
    };
}

export async function analyzeClient(
    businessName: string,
    websiteContent: string,
    metadata: string,
    address?: string,
    socialData?: string,
    techStack?: any,
    competitors: any[] = [],
    language: 'fr' | 'en' = 'fr',
    mode: 'rapid' | 'deep' = 'deep'
): Promise<ClientAnalysis> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const langInstructions = language === 'fr'
        ? `Write the email draft entirely in French. Use "tu" or "vous" naturally depending on the business vibe. Sound like a real Québécois entrepreneur, not a Paris marketing firm.`
        : `Write the email draft entirely in English. Sound like a real person, not a marketing team.`;

    const socialSection = socialData
        ? `\n    Social Media Profiles Found:\n    ${socialData}\n\n    IMPORTANT SOCIAL MEDIA ANALYSIS RULES:
    - If a profile says "[Could not scrape details...]", it means the platform successfully blocked our bot. This is NORMAL. Do NOT say their profile is empty or bad.
    - Instead, base your analysis heavily on the brand vibe and website context. Assume their social media reflects their website's quality.
    - FOCUS ON CONTENT PREDICTION: Infer the TYPE of content they likely post (Video, Photo, Educational) based on their industry and vibe.
    - Analyze the CONTENT STYLE: Is it authentic UGC, high-end professional, or generic?
    - If you see scraped follower/post counts, use them to judge growth potential. Otherwise, skip mentioning numbers.
    - "verdict" should be a 1-sentence CRITIQUE: e.g. "Solid brand identity on the website, but likely missing a strong Reels/TikTok strategy based on their static industry."
    `
        : '';

    const socialJsonSection = socialData
        ? `\n    5. "socialMedia": {
        "overallVerdict": "A practical 1-2 sentence assessment. Focus on the CONTENT OPPORTUNITY.",
        "contentStrategy": "A 2-3 sentence strategic roadmap. What is the ONE big move they should make on socials?",
        "insights": [
            {
                "platform": "Instagram",
                "url": "the profile URL",
                "followers": "follower count if found, or null",
                "postsCount": "post count if found, or null",
                "verdict": "A sharp, specific critique about their content quality and strategy. If protected, infer based on website vibe.",
                "contentType": "Short-form video / Photography / Educational / Mixed",
                "postingSchedule": "Active / Inconsistent / Ghost / Could not determine",
                "contentStyle": "UGC / Professional / Sales-heavy / Informational",
                "contentMix": "Estimate the ratio, e.g. '3:1 Photo/Video' or 'Mostly Reels'",
                "lastPostRecency": "Estimate how long ago their last post was, e.g. '2 days ago' or '15 weeks ago'",
                "contentIdeas": ["Idea 1", "Idea 2", "Idea 3"],
                "score": 3-10
            }
        ]
    }`
        : '';

    const techSection = techStack
        ? `\n    Technologies Detected on their Website:\n    - CMS: ${techStack.cms.join(', ') || 'None Detected'}\n    - Analytics: ${techStack.analytics.join(', ') || 'None Detected'}\n    - Pixels/Ads: ${techStack.pixels.join(', ') || 'None Detected'}\n`
        : '';

    const competitorSection = competitors.length > 0
        ? `\n    Top Local Competitors:\n${competitors.map(c => `    - ${c.name} (${c.rating} stars, ${c.user_ratings_total} reviews)`).join('\n')}\n`
        : '';

    const rapidPrompt = `
    Conduct a RAPID audit for this business.
    Business Name: ${businessName}
    Location/Address: ${address || 'Unknown'}
    Website Content Snippet: ${websiteContent.substring(0, 1000)}
    ${techSection}
    
    Provide a JSON response with:
    1. "summary": A 1-sentence description of what they do.
    2. "qualificationScore": A score from 1 to 10 based on digital presence.
    3. "brandVibe": A 3-word vibe description.
    
    Response must be valid JSON only.
    `;

    const deepPrompt = `
    Analyze the following business to see how a digital agency/software consultancy could help them.
    Business Name: ${businessName}
    Location/Address: ${address || 'Unknown'}
    Website Content Snippet: ${websiteContent.substring(0, 5000)}
    Metadata: ${metadata}
    ${techSection}
    ${competitorSection}
    ${socialSection}

    Provide a JSON response with:
    1. "summary": A brief overview of what they do (2-3 sentences max).
    2. "brandVibe": A description of their current visual and tonal identity (e.g. "Trusted local expert, traditional aesthetic, text-heavy").
    3. "painPoints": An array of SHORT strings (max 15 words each). Return 3-5 items. (e.g. "No TikTok pixel installed", "Outdated WordPress design").
    4. "suggestions": An array of SHORT strings (max 15 words each). Return 3 items.
    5. "qualificationScore": A score from 1 to 10.
    6. "techStack": (Optional) The parsed tech stack if you have meaningful insights on it.
    7. "competitors": (Optional) An array of strings with 1-2 sharp observations about how they compare to the provided "Top Local Competitors" (e.g. "They have 50 fewer reviews than Competitor X").
    8. "emailDraft": A highly personalized, 3-4 sentence cold outreach email. It should start with a specific compliment based on their website or socials. If you have their Location/Address, try to reference their specific city or neighborhood. If they lack a specific pixel (like Meta or TikTok) but run ads, or if they have an old CMS, you MUST subtly mention it to build authority. If you have competitor data, you can optionally drop a competitor's name to build urgency (e.g., "I noticed [Competitor Name] has been doubling down on video content lately..."). End with a low-friction question. ${langInstructions}
    ${socialJsonSection}

    CRITICAL: painPoints and suggestions must be arrays of plain strings.
    Response must be valid JSON only.
    `;

    const prompt = mode === 'rapid' ? rapidPrompt : deepPrompt;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);

        const normalize = (arr: any[]): string[] => arr.map((item: any) => {
            if (typeof item === 'string') return item;
            if (item?.title && item?.description) return `${item.title}: ${item.description}`;
            if (item?.title) return item.title;
            if (item?.description) return item.description;
            return JSON.stringify(item);
        });

        return {
            summary: parsed.summary || '',
            brandVibe: parsed.brandVibe || 'Professional / Local',
            painPoints: normalize(parsed.painPoints || []),
            suggestions: normalize(parsed.suggestions || []),
            qualificationScore: parsed.qualificationScore || 0,
            techStack: parsed.techStack || undefined,
            competitors: parsed.competitors || undefined,
            emailDraft: parsed.emailDraft || '',
            socialMedia: parsed.socialMedia || undefined,
        };
    } catch (e) {
        console.error('Failed to parse Gemini analysis:', text);
        return {
            summary: 'Analysis failed to parse.',
            brandVibe: 'Unknown',
            painPoints: [],
            suggestions: [],
            qualificationScore: 0,
            emailDraft: '',
        };
    }
}
