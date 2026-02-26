import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        const { feedbackText, projectTitle, clientName } = await req.json();

        const prompt = `Tu es un directeur de post-production expérimenté. Un client a laissé un feedback sur un projet vidéo. Ton rôle est de transformer ce feedback en INSTRUCTIONS DE MONTAGE claires et actionables pour l'éditeur vidéo.

Projet : "${projectTitle || 'Projet vidéo'}"
Client : "${clientName || 'Client'}"

Feedback du client :
"${feedbackText}"

Génère des instructions de montage précises. Pour chaque point :
- Décris exactement quoi changer
- Sois technique et spécifique (coupes, transitions, timing, audio, couleurs, texte)
- Priorise par importance

IMPORTANT: Réponds dans la même langue que le feedback du client.

Réponds en JSON (pas de markdown, pas de code fences) :
{"instructions": [{"priority": "haute/moyenne/basse", "action": "instruction précise pour l'éditeur"}], "summary": "résumé en une phrase de ce que le client veut"}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.4,
                max_tokens: 800,
            }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('OpenAI API error:', errBody);
            return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (!content) return NextResponse.json({ error: 'No content generated' }, { status: 500 });

        const result = JSON.parse(content);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Post-prod notes error:', error);
        return NextResponse.json({ error: 'Failed to generate notes' }, { status: 500 });
    }
}
