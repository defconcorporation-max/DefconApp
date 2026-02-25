import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        const { clientName, existingIdeas, contentType, tone, generateScript } = await req.json();

        const existingTitles = (existingIdeas || []).map((i: string) => `- ${i}`).join('\n');

        const contentTypeLabel = contentType === 'ad' ? 'une publicité (Ad)'
            : contentType === 'organic-educational' ? 'du contenu organique éducatif'
                : contentType === 'organic-viral' ? 'du contenu organique viral'
                    : 'une vidéo';
        const adFramework = contentType === 'ad' ? `
STRUCTURE POUR LA PUB: La vidéo doit suivre cette structure générale (mais reformule à chaque fois de façon ORIGINALE et UNIQUE, ne copie JAMAIS mot pour mot) :
1. ACCROCHE — Interpelle le viewer avec son désir/problème ("Tu veux faire X ?", "T'en as marre de Y ?", "Imagine si tu pouvais Z...")
2. PRÉSENTATION — Présente qui est le client ("Nous on est...", "Chez [nom]...", "On est une équipe de...")
3. VALEUR — Montre ce qu'ils font concrètement ("On fait X, Y, Z", "Notre spécialité c'est...", "On t'accompagne pour...")
4. CALL TO ACTION — Pousse à l'action ("Remplis le formulaire", "Contacte-nous", "Écris-nous", "On s'occupe de toi")
Chaque pub doit être DIFFÉRENTE dans le wording. Sois créatif et naturel, comme si quelqu'un parlait face caméra.
` : '';

        let prompt = `Tu es un directeur créatif dans une agence de production vidéo. Génère UNE idée de contenu vidéo créative et fraîche pour un client appelé "${clientName}".

Le type de contenu demandé est : ${contentTypeLabel}.
${adFramework}${tone ? `Le ton et l'humeur souhaités : ${tone}.` : ''}

${existingTitles ? `Le client a déjà ces idées, alors propose quelque chose de DIFFÉRENT :\n${existingTitles}\n` : ''}

IMPORTANT: Détecte la langue des idées existantes ci-dessus. Si elles sont en français, réponds entièrement en français. Si elles sont en anglais, réponds en anglais. S'il n'y a pas d'idées existantes, réponds en français par défaut.

Réponds dans ce format JSON exact (pas de markdown, pas de code fences) :
{"title": "Titre court et percutant (max 10 mots)", "description": "Description de 2-3 phrases du concept vidéo, incluant le style visuel, le ton, et le message clé."}`;

        if (generateScript) {
            prompt = `Tu es un directeur créatif et scénariste dans une agence de production vidéo. Génère UNE idée de contenu vidéo créative pour un client appelé "${clientName}", AVEC un script complet.

Le type de contenu demandé est : ${contentTypeLabel}.
${adFramework}${tone ? `Le ton et l'humeur souhaités : ${tone}.` : ''}

${existingTitles ? `Le client a déjà ces idées, alors propose quelque chose de DIFFÉRENT :\n${existingTitles}\n` : ''}

IMPORTANT: Détecte la langue des idées existantes ci-dessus. Si elles sont en français, réponds entièrement en français. Si elles sont en anglais, réponds en anglais. S'il n'y a pas d'idées existantes, réponds en français par défaut.

Réponds dans ce format JSON exact (pas de markdown, pas de code fences) :
{"title": "Titre court et percutant (max 10 mots)", "description": "Description de 2-3 phrases du concept vidéo.", "script": "UNIQUEMENT les paroles à dire devant la caméra. PAS de didascalie, PAS d'indication de scène, PAS de description visuelle, PAS de crochets. Juste le texte parlé. Saute une ligne environ tous les 6 mots pour faciliter les coupures caméra et la lecture lors des tournages."}`;
        }

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
                max_tokens: generateScript ? 1500 : 300,
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

        const idea = JSON.parse(content);

        return NextResponse.json({
            title: idea.title,
            description: idea.description,
            script: idea.script || null
        });
    } catch (error) {
        console.error('Generate idea error:', error);
        return NextResponse.json({ error: 'Failed to generate idea' }, { status: 500 });
    }
}
