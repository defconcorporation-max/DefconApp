import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        const { clientName, existingIdeas } = await req.json();

        const existingTitles = (existingIdeas || []).map((i: string) => `- ${i}`).join('\n');

        const prompt = `You are a creative director at a video production agency. Generate ONE fresh, creative video content idea for a client called "${clientName}".

${existingTitles ? `The client already has these ideas, so suggest something DIFFERENT:\n${existingTitles}\n` : ''}

Respond in this exact JSON format (no markdown, no code fences):
{"title": "Short punchy title (max 10 words)", "description": "2-3 sentence description of the video concept, including the visual style, tone, and key message."}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.9,
                max_tokens: 300,
            }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('OpenAI API error:', errBody);
            return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();

        if (!content) {
            return NextResponse.json({ error: 'No content generated' }, { status: 500 });
        }

        // Parse the JSON response from GPT
        const idea = JSON.parse(content);

        return NextResponse.json({ title: idea.title, description: idea.description });
    } catch (error) {
        console.error('Generate idea error:', error);
        return NextResponse.json({ error: 'Failed to generate idea' }, { status: 500 });
    }
}
