'use server';

export async function generateShootConceptAndMood(clientName: string, promptHint: string) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return { error: 'OpenAI API key not configured' };
        }

        const prompt = `Tu es un directeur de création dans une société de production vidéo de haute qualité.
Ton rôle est de générer un concept créatif et une ambiance (mood) pour le client: "${clientName}".
L'utilisateur a donné cette direction (si vide, sois inventif) : "${promptHint}"

Réponds UNIQUEMENT dans ce format JSON valide:
{
  "concept": "1 ou 2 paragraphes décrivant l'idée principale, la narration et le but.",
  "mood": "Une liste de mots clés, le style visuel, les couleurs et le ton musical."
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
            }),
        });

        if (!response.ok) {
            return { error: 'AI generation failed' };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();

        if (!content) return { error: 'No content' };

        // Clean potentially returned markdown blocks
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
            concept: parsed.concept,
            mood: parsed.mood
        };

    } catch (error) {
        console.error('AI concept generation error:', error);
        return { error: 'Failed' };
    }
}
