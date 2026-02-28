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
    socialData?: string
): Promise<ClientAnalysis> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const socialSection = socialData
        ? `\n    Social Media Profiles Found:\n    ${socialData}\n\n    IMPORTANT SOCIAL MEDIA ANALYSIS RULES:
    - If a profile was "[Could not scrape]", do NOT say "Unknown followers" or guess randomly.
    - Instead, base your analysis on: the username/page name, what the website tells us about their social activity, and your general knowledge.
    - FOCUS ON CONTENT: Try to infer the TYPE of content they post (Video, Photo, Educational, Viral, etc.) based on their brand vibe and any snippets.
    - Analyze the POSTING SCHEDULE: Does it look active or abandoned?
    - Analyze the CONTENT STYLE: Is it authentic UGC, high-end professional, or just dry sales posts?
    - If you see follower counts or posts counts, use them to judge their growth potential.
    - "verdict" should be a 1-sentence CRITIQUE: "Good follower base but posts are generic sales flyers — needs a Reels strategy."
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
                "verdict": "A sharp, specific critique about their content quality and strategy.",
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

    const prompt = `
    Analyze the following business to see how a digital agency/software consultancy could help them.
    Business Name: ${businessName}
    Website Content Snippet: ${websiteContent.substring(0, 5000)}
    Metadata: ${metadata}
    ${socialSection}

    Provide a JSON response with:
    1. "summary": A brief overview of what they do (2-3 sentences max).
    2. "brandVibe": A description of their current visual and tonal identity (e.g. "Trusted local expert, traditional aesthetic, text-heavy").
    3. "painPoints": An array of SHORT strings (max 15 words each). Return 3-5 items.
    4. "suggestions": An array of SHORT strings (max 15 words each). Return 3 items.
    5. "qualificationScore": A score from 1 to 10.
    ${socialJsonSection}

    CRITICAL: painPoints and suggestions must be arrays of plain strings.
    Response must be valid JSON only.
  `;

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
        };
    }
}

export async function draftIntroEmail(
    businessName: string,
    analysis: ClientAnalysis,
    language: 'fr' | 'en' = 'fr'
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const langInstructions = language === 'fr'
        ? `Write entirely in French. Use "tu" or "vous" naturally depending on the business vibe. Sound like a real Québécois/French entrepreneur, not a Paris marketing firm.`
        : `Write entirely in English. Sound like a real person, not a marketing team.`;

    const socialContext = analysis.socialMedia
        ? `\n    - Their social media: ${analysis.socialMedia.overallVerdict}`
        : '';

    const prompt = `
    Write a SHORT cold intro email to ${businessName}.

    Context from our research:
    - What they do: ${analysis.summary}
    - AI's main suggestion for them: ${analysis.suggestions[0] || 'improving their online presence'}${socialContext}

    ${langInstructions}

    CORE OFFER & STRATEGY:
    - Our company's biggest strength is Social Media Strategy (creation, growth, ads, video content).
    - The entire pitch MUST pivot toward how we can help them completely dominate their social media presence or fix what they are lacking on socials.
    - Even if the AI suggestion is about their website, try to tie it back to social media or make social media the star of the pitch.

    RULES — THIS IS CRITICAL:
    - Sound like a REAL HUMAN who genuinely checked their business. Not a template.
    - NO corporate buzzwords ("synergy", "leverage", "solutions provider", "digital agency").
    - Do NOT start with "I hope this finds you well" or "I came across your business".
    - Start with something specific about THEIR business that shows you actually looked.
    - Keep it to 4-6 sentences MAX. People don't read long cold emails.
    - End with a casual invite to chat about their social media game, not a hard sell.
    - Sign off with [Votre nom] / [Your Name] as placeholder.
    - The sender works at Interstellar Viking, a small creative studio.
    - Make it feel like a message you'd actually send to someone, not something ChatGPT wrote.
    
    Output the email text only, no subject line, no markdown formatting.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
