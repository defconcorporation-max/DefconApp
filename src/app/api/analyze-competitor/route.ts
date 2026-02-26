import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        const { competitorDescription, clientName, clientIndustry } = await req.json();

        const prompt = `Tu es un stratège de contenu vidéo expert. Un client appelé "${clientName}" veut se différencier de la concurrence.

${clientIndustry ? `Industrie du client : ${clientIndustry}` : ''}

Voici la description du concurrent ou de son contenu :
"${competitorDescription}"

Analyse ce concurrent et propose 4-5 ANGLES DE CONTENU VIDÉO qui permettraient au client de se différencier. Pour chaque angle :
- Un titre accrocheur
- Pourquoi ça marche mieux que ce que fait le concurrent
- Le format suggéré (Reels, long-form, série, etc.)

Sois créatif et stratégique. Pense à ce qui est tendance en ce moment.

IMPORTANT: Réponds dans la même langue que la description du concurrent. Si pas clair, réponds en français.

Réponds en JSON (pas de markdown, pas de code fences) :
{"angles": [{"title": "titre de l'angle", "why": "pourquoi c'est différenciant", "format": "format suggéré"}], "keyInsight": "insight stratégique principal en une phrase"}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.85,
                max_tokens: 1000,
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
        console.error('Competitor analysis error:', error);
        return NextResponse.json({ error: 'Failed to analyze competitor' }, { status: 500 });
    }
}
