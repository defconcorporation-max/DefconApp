import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { turso } from '@/lib/turso';
import { addDaysToDateKey, todayDateKeyBusiness } from '@/lib/date-local';

export const dynamic = 'force-dynamic';

/**
 * AI Executive Summary — generates a daily briefing from real data.
 * Uses Gemini if available, otherwise falls back to a structured summary.
 */
export async function GET() {
    const session = await auth();
    if (!session || (session.user?.role !== 'Admin' && session.user?.role !== 'Team')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fuseau métier (Québec par défaut), pas UTC — cohérent avec shoot_date en base
        const today = todayDateKeyBusiness();
        const weekFromNow = addDaysToDateKey(today, 7);

        // Gather key metrics in parallel
        const [
            { rows: todayShoots },
            { rows: weekShoots },
            { rows: overdueTasks },
            { rows: pendingPayments },
            { rows: recentActivity },
            { rows: overdueProjects },
        ] = await Promise.all([
            turso.execute({ sql: "SELECT title, client_id FROM shoots WHERE shoot_date = ?", args: [today] }),
            turso.execute({ sql: "SELECT COUNT(*) as count FROM shoots WHERE shoot_date BETWEEN ? AND ?", args: [today, weekFromNow] }),
            turso.execute({
                sql: `SELECT pt.title, p.title as project_title 
                      FROM project_tasks pt JOIN projects p ON pt.project_id = p.id 
                      WHERE pt.is_completed = 0 AND pt.due_date < ? LIMIT 5`,
                args: [today]
            }),
            turso.execute({
                sql: `SELECT COALESCE(SUM(ps.rate * ps.quantity), 0) as pending
                      FROM project_services ps
                      JOIN projects p ON ps.project_id = p.id
                      WHERE p.status IN ('Active', 'In Progress')`,
                args: []
            }),
            turso.execute({
                sql: "SELECT type, description FROM activities ORDER BY created_at DESC LIMIT 3",
                args: []
            }),
            turso.execute({
                sql: `SELECT title, due_date FROM projects 
                      WHERE due_date < ? AND status NOT IN ('Completed', 'Archived') LIMIT 3`,
                args: [today]
            }),
        ]);

        // Build structured summary
        const shootsToday = todayShoots.length;
        const shootsWeek = (weekShoots[0] as any)?.count || 0;
        const taskOverdueCount = overdueTasks.length;
        const projectOverdueCount = overdueProjects.length;

        const sections = [];

        // Today
        if (shootsToday > 0) {
            sections.push(`📸 **${shootsToday} shoot(s) aujourd'hui** : ${todayShoots.map((s: any) => s.title).join(', ')}`);
        } else {
            sections.push(`📸 Aucun shoot prévu aujourd'hui.`);
        }

        // Week
        sections.push(`📅 **${shootsWeek} shoot(s) cette semaine**.`);

        // Overdue
        if (taskOverdueCount > 0 || projectOverdueCount > 0) {
            const items = [];
            if (taskOverdueCount > 0) items.push(`${taskOverdueCount} tâche(s)`);
            if (projectOverdueCount > 0) items.push(`${projectOverdueCount} projet(s)`);
            sections.push(`⚠️ **En retard** : ${items.join(', ')}. ${overdueTasks.map((t: any) => `"${t.title}" (${t.project_title})`).join(', ')}`);
        } else {
            sections.push(`✅ Rien en retard — on est à jour !`);
        }

        // Recent activity
        if (recentActivity.length > 0) {
            sections.push(`🔔 **Activité récente** : ${recentActivity.map((a: any) => a.description).join(' | ')}`);
        }

        // AI call to Gemini if API key is available
        let aiSummary = null;
        const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (geminiKey) {
            try {
                const prompt = `Tu es un assistant exécutif pour une boîte de production vidéo. Voici le résumé du jour:
- Shoots aujourd'hui: ${shootsToday}
- Shoots cette semaine: ${shootsWeek}  
- Tâches en retard: ${taskOverdueCount}
- Projets en retard: ${projectOverdueCount}
- Détails tâches en retard: ${overdueTasks.map((t: any) => t.title).join(', ') || 'aucune'}

Génère un résumé exécutif de 2-3 phrases, motivant et actionable. En français. Pas de markdown.`;

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { maxOutputTokens: 200, temperature: 0.7 }
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    aiSummary = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
                }
            } catch (e) {
                console.error('[AI Summary] Gemini call failed:', e);
            }
        }

        return NextResponse.json({
            date: today,
            shootsToday,
            shootsWeek,
            taskOverdueCount,
            projectOverdueCount,
            sections,
            aiSummary,
        });
    } catch (error) {
        console.error('AI summary generation failed:', error);
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
}
