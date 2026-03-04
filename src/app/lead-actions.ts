'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';
import { scrapeWebsite } from '@/lib/scraper';
import { analyzeClient } from '@/lib/gemini';
import { broadAreaSearch, getPlaceDetails, getTopCompetitors, Business } from '@/lib/maps';

export interface Lead {
    id?: number;
    place_id: string;
    name: string;
    address?: string;
    website?: string;
    phone?: string;
    rating?: number;
    user_ratings_total?: number;
    status: string;
    notes?: string;
    last_contact_at?: string;
    assigned_member_id?: number | null;
    reach_count?: number;
    last_reach_at?: string;
    created_at?: string;
    // Joined data
    analysis?: {
        summary: string;
        pain_points: string[];
        suggestions: string[];
        qualification_score: number;
        email_draft: string;
        social_verdict?: string;
        social_json?: any[]; // Detailed platform insights
    };
    scrapedData?: {
        emails: string[];
        social_json: any;
        title: string;
        description: string;
        techStack?: any;
    };
}

export interface PipelineStage {
    id: number;
    label: string;
    value: string;
    color: string;
    order_index: number;
}

export interface TeamMember {
    id: number;
    name: string;
    role?: string;
    color?: string;
}

export async function searchLeadsAction(query: string, sector?: string, radius: number = 1000, explicitLat?: number, explicitLng?: number) {
    try {
        const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!key) throw new Error("Google Maps API key missing");

        let searchLat = explicitLat;
        let searchLng = explicitLng;

        if (!searchLat || !searchLng) {
            // Geocode the location/query first to get coordinates
            const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}`;
            const geoResult = await fetch(geoUrl).then(res => res.json());

            if (geoResult.status !== 'OK') {
                throw new Error(`Location "${query}" not found. Please enter a valid city or address.`);
            }

            searchLat = geoResult.results[0].geometry.location.lat;
            searchLng = geoResult.results[0].geometry.location.lng;
        }

        // Use sector as primary keyword. If empty, broadAreaSearch will find all establishments.
        const businesses = await broadAreaSearch(searchLat!, searchLng!, radius, sector || undefined);

        // Check if leads are already in the database
        const placeIds = businesses.map(b => b.place_id);
        if (placeIds.length > 0) {
            const placeholders = placeIds.map(() => '?').join(',');
            const existingLeads = await db.execute({
                sql: `SELECT l.*, a.* 
                      FROM leads l 
                      LEFT JOIN lead_analyses a ON l.id = a.lead_id 
                      WHERE l.place_id IN (${placeholders})`,
                args: placeIds
            });

            // Merge existing data
            const existingMap = new Map(existingLeads.rows.map((row: any) => [row.place_id, row]));

            businesses.forEach(b => {
                const existing = existingMap.get(b.place_id);
                if (existing) {
                    b.in_pipeline = true;
                    b.status = existing.status;
                    b.analysis = {
                        summary: existing.summary,
                        pain_points: JSON.parse(existing.pain_points || '[]'),
                        suggestions: JSON.parse(existing.suggestions || '[]'),
                        qualification_score: existing.qualification_score,
                        email_draft: existing.email_draft,
                        social_verdict: existing.social_verdict,
                        social_json: JSON.parse(existing.social_json || '[]'),
                        mode: existing.mode || 'deep'
                    };
                }
            });
        }

        return { success: true, businesses };
    } catch (error: any) {
        console.error("[LeadActions] Search error:", error);
        return { success: false, error: error.message };
    }
}

export async function getLeadDetailsAction(placeId: string) {
    try {
        const details = await getPlaceDetails(placeId);
        return { success: true, details };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function qualifyLeadAction(lead: any, language: 'fr' | 'en' = 'fr', mode: 'rapid' | 'deep' = 'deep') {
    try {
        let { place_id, name, website, phone } = lead;
        let updatedDetails: any = {};
        let scrapedData: any = null;
        let detailsPromise = null;

        // 1. Launch Place Details fetch if we're missing phone or website
        if (!website || !phone) {
            detailsPromise = getPlaceDetails(place_id);
        }

        // 2. If we already have a website, launch scraper immediately in parallel
        let scrapePromise = null;
        if (website) {
            scrapePromise = scrapeWebsite(website, mode === 'rapid');
        }

        // 3. Await details if we needed them
        if (detailsPromise) {
            const details = await detailsPromise;
            if (details.website && !website) {
                website = details.website;
                updatedDetails.website = website;
                // Launch scraper now that we found the website
                scrapePromise = scrapeWebsite(website, mode === 'rapid');
            }
            if (details.phone && !phone) {
                phone = details.phone;
                updatedDetails.phone = phone;
            }
        }

        if (!website) {
            return { success: false, error: "No website found for this business. Scraping & Qualification aborted." };
        }

        // 4. Await scraper (either launched early or just now)
        if (scrapePromise) {
            scrapedData = await scrapePromise;
        }

        // 4.5 Fetch Top Competitors
        let competitors: Business[] = [];
        if (mode === 'deep' && lead.location?.lat && lead.location?.lng) {
            // We use the first 'type' as the keyword for competitors, or default to their name
            const keyword = lead.types?.[0] || name;
            try {
                competitors = await getTopCompetitors(lead.location.lat, lead.location.lng, keyword, place_id);
            } catch (e) {
                console.error("Failed to fetch competitors:", e);
            }
        }

        // 5. AI Analysis (Now includes email drafting in one go)
        let socialDataStr = '';
        if (scrapedData?.socialProfiles?.length) {
            socialDataStr = scrapedData.socialProfiles.map((p: any) => {
                let info = `Platform: ${p.platform}, URL: ${p.url}`;
                if (p.username) info += `, Username: @${p.username}`;
                if (p.scraped) {
                    if (p.name) info += `, Name: ${p.name}`;
                    if (p.bio) info += `, Bio: ${p.bio}`;
                    if (p.followers) info += `, Followers: ${p.followers}`;
                    info += ` [Scraped]`;
                }
                return info;
            }).join('\n');
        }

        const rawAnalysis = await analyzeClient(
            name,
            scrapedData?.description || scrapedData?.title || 'No content found',
            JSON.stringify({ emails: scrapedData?.emails || [], title: scrapedData?.title || '' }),
            lead.address || undefined,
            mode === 'deep' ? socialDataStr : undefined,
            scrapedData?.techStack || undefined,
            competitors || [],
            language,
            mode
        );

        const result = {
            success: true,
            updatedDetails, // Return new phone/website found
            scrapedData,
            analysis: {
                summary: rawAnalysis.summary,
                pain_points: rawAnalysis.painPoints,
                suggestions: rawAnalysis.suggestions,
                qualification_score: rawAnalysis.qualificationScore,
                mode: mode, // 'rapid' or 'deep'
                tech_stack: rawAnalysis.techStack,
                competitors: rawAnalysis.competitors,
                email_draft: rawAnalysis.emailDraft,
                social_verdict: rawAnalysis.socialMedia?.overallVerdict,
                social_json: rawAnalysis.socialMedia?.insights || [],
                brand_vibe: rawAnalysis.brandVibe,
                content_strategy: rawAnalysis.socialMedia?.contentStrategy
            }
        };

        // 6. AUTO-SAVE to pipeline so that qualifications persist
        try {
            const saveLead = {
                ...lead,
                ...updatedDetails
            };
            await saveLeadToPipeline(saveLead, scrapedData, result.analysis);
        } catch (saveError) {
            console.error("Auto-save failed during qualification:", saveError);
        }

        return result;
    } catch (error: any) {
        console.error("[LeadActions] Qualification error:", error);
        return { success: false, error: error.message };
    }
}

export async function saveLeadToPipeline(lead: Lead, scrapedData?: any, analysis?: any) {
    try {
        // 1. Save Base Lead
        await db.execute({
            sql: `INSERT INTO leads (place_id, name, address, website, phone, rating, user_ratings_total, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, 'New')
                  ON CONFLICT(place_id) DO UPDATE SET status = status`,
            args: [
                lead.place_id,
                lead.name,
                lead.address || null,
                lead.website || null,
                lead.phone || null,
                lead.rating || null,
                lead.user_ratings_total || null
            ]
        });

        // Get ID (could be from INSERT or existing)
        const leadIdRow = await db.execute({
            sql: "SELECT id FROM leads WHERE place_id = ?",
            args: [lead.place_id]
        });
        const leadId = Number(leadIdRow.rows[0].id);

        // 2. Save Scraped Data
        if (scrapedData) {
            await db.execute({
                sql: `INSERT INTO lead_scraped_data (lead_id, emails, social_json, title, description) 
                      VALUES (?, ?, ?, ?, ?)
                      ON CONFLICT(lead_id) DO UPDATE SET emails = excluded.emails`,
                args: [
                    leadId,
                    JSON.stringify(scrapedData.emails || []),
                    JSON.stringify(scrapedData.socialProfiles || []),
                    scrapedData.title || '',
                    scrapedData.description || ''
                ]
            });
        }

        // 3. Save Analysis
        if (analysis) {
            await db.execute({
                sql: `INSERT INTO lead_analyses (lead_id, summary, pain_points, suggestions, qualification_score, mode, email_draft, social_verdict, social_json, brand_vibe, content_strategy) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                      ON CONFLICT(lead_id) DO UPDATE SET 
                        summary = excluded.summary,
                        pain_points = excluded.pain_points,
                        suggestions = excluded.suggestions,
                        qualification_score = excluded.qualification_score,
                        mode = excluded.mode,
                        email_draft = excluded.email_draft,
                        social_verdict = excluded.social_verdict,
                        social_json = excluded.social_json,
                        brand_vibe = excluded.brand_vibe,
                        content_strategy = excluded.content_strategy`,
                args: [
                    leadId,
                    analysis.summary || '',
                    JSON.stringify(analysis.pain_points || []),
                    JSON.stringify(analysis.suggestions || []),
                    analysis.qualification_score || 0,
                    analysis.mode || 'deep',
                    analysis.email_draft || '',
                    analysis.social_verdict || '',
                    JSON.stringify(analysis.social_json || []),
                    analysis.brand_vibe || '',
                    analysis.content_strategy || ''
                ]
            });
        }

        revalidatePath('/leads');
        return { success: true, leadId };
    } catch (error: any) {
        console.error("[LeadActions] Save error:", error);
        return { success: false, error: error.message };
    }
}

export async function getPipelineLeads(): Promise<Lead[]> {
    try {
        const { rows } = await db.execute(`
            SELECT 
                l.*,
                la.summary, la.pain_points, la.suggestions, la.qualification_score, la.email_draft, la.social_verdict, la.social_json as ai_social_json,
                la.brand_vibe, la.content_strategy,
                lsd.emails, lsd.social_json, lsd.title as site_title, lsd.description as site_desc
            FROM leads l
            LEFT JOIN lead_analyses la ON l.id = la.lead_id
            LEFT JOIN lead_scraped_data lsd ON l.id = lsd.lead_id
            ORDER BY l.created_at DESC
        `);

        return rows.map((r: any) => ({
            ...r,
            analysis: r.summary ? {
                summary: r.summary,
                pain_points: JSON.parse(r.pain_points || '[]'),
                suggestions: JSON.parse(r.suggestions || '[]'),
                qualification_score: r.qualification_score,
                email_draft: r.email_draft,
                social_verdict: r.social_verdict,
                social_json: JSON.parse(r.ai_social_json || '[]'),
                brandVibe: r.brand_vibe,
                contentStrategy: r.content_strategy
            } : undefined,
            scrapedData: r.emails ? {
                emails: JSON.parse(r.emails || '[]'),
                social_json: JSON.parse(r.social_json || '[]'),
                title: r.site_title,
                description: r.site_desc
            } : undefined
        })) as Lead[];
    } catch (error) {
        console.error("[LeadActions] Get leads error:", error);
        return [];
    }
}

export async function updateLeadStatusAction(leadId: number, status: string) {
    await db.execute({
        sql: "UPDATE leads SET status = ? WHERE id = ?",
        args: [status, leadId]
    });
    revalidatePath('/leads');
}

export async function deleteLeadAction(leadId: number) {
    await db.execute({
        sql: "DELETE FROM leads WHERE id = ?",
        args: [leadId]
    });
    revalidatePath('/leads');
}

export async function updateLeadNotesAction(leadId: number, notes: string) {
    await db.execute({
        sql: "UPDATE leads SET notes = ? WHERE id = ?",
        args: [notes, leadId]
    });
    revalidatePath('/leads');
}

export async function markLeadContactedAction(leadId: number) {
    await db.execute({
        sql: "UPDATE leads SET last_contact_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [leadId]
    });
    revalidatePath('/leads');
}

export async function logReachAttemptAction(leadId: number) {
    await db.execute({
        sql: "UPDATE leads SET reach_count = COALESCE(reach_count, 0) + 1, last_reach_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [leadId]
    });
    revalidatePath('/leads');
}

export async function assignLeadAction(leadId: number, memberId: number | null) {
    await db.execute({
        sql: "UPDATE leads SET assigned_member_id = ? WHERE id = ?",
        args: [memberId, leadId]
    });
    revalidatePath('/leads');
}

export async function getPipelineStagesAction(): Promise<PipelineStage[]> {
    try {
        const { rows } = await db.execute("SELECT * FROM lead_pipeline_stages ORDER BY order_index ASC");
        return rows as any as PipelineStage[];
    } catch (error) {
        console.error("Failed to fetch pipeline stages:", error);
        return [];
    }
}

export async function getTeamMembersAction(): Promise<TeamMember[]> {
    try {
        const { rows } = await db.execute("SELECT id, name, role, color FROM team_members ORDER BY name ASC");
        return rows as any as TeamMember[];
    } catch (error) {
        console.error("Failed to fetch team members:", error);
        return [];
    }
}

export async function updatePipelineStageAction(id: number, data: Partial<PipelineStage>) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    await db.execute({
        sql: `UPDATE lead_pipeline_stages SET ${fields} WHERE id = ?`,
        args: [...values, id]
    });
    revalidatePath('/leads');
}

export async function addPipelineStageAction(label: string, color: string = 'gray') {
    if (!label) return;
    const value = label.toLowerCase().replace(/\s+/g, '_');

    const resultRes = await db.execute('SELECT MAX(order_index) as maxOrder FROM lead_pipeline_stages');
    const result = resultRes.rows[0] as unknown as { maxOrder: number };
    const nextOrder = (result?.maxOrder ?? -1) + 1;

    await db.execute({
        sql: 'INSERT INTO lead_pipeline_stages (label, value, color, order_index) VALUES (?, ?, ?, ?)',
        args: [label, value, color, nextOrder]
    });
    revalidatePath('/leads');
}

export async function reorderPipelineStagesAction(stages: PipelineStage[]) {
    const statements = stages.map((s, i) => ({
        sql: 'UPDATE lead_pipeline_stages SET order_index = ? WHERE id = ?',
        args: [i, s.id]
    }));
    await db.batch(statements, 'write');
    revalidatePath('/leads');
}

export async function deletePipelineStageAction(id: number) {
    await db.execute({
        sql: 'DELETE FROM lead_pipeline_stages WHERE id = ?',
        args: [id]
    });
    revalidatePath('/leads');
}

export async function sendSmsAction(phone: string, message: string) {
    // This is a placeholder for Twilio integration
    // Requires TWILIO_ACCOUNT_SID, AUTH_TOKEN, and TWILIO_NUMBER in .env
    console.log(`[Twilio Simulation] Sending SMS to ${phone}: ${message}`);
    return { success: true, message: "SMS sent (simulated)" };
}
