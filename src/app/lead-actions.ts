'use server';

import { turso as db } from '@/lib/turso';
import { revalidatePath } from 'next/cache';
import { scrapeWebsite } from '@/lib/scraper';
import { analyzeClient, draftIntroEmail } from '@/lib/gemini';
import { broadAreaSearch, getPlaceDetails } from '@/lib/maps';

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
    created_at?: string;
    // Joined data
    analysis?: {
        summary: string;
        pain_points: string[];
        suggestions: string[];
        qualification_score: number;
        email_draft: string;
        social_verdict?: string;
    };
    scrapedData?: {
        emails: string[];
        social_json: any;
        title: string;
        description: string;
    };
}

export async function searchLeadsAction(query: string, radius: number = 1000) {
    try {
        const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!key) throw new Error("Google Maps API key missing");

        // Geocode the query first
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}`;
        const geoRes = await fetch(geoUrl).then(res => res.json());

        if (geoRes.status !== 'OK') {
            throw new Error("Location not found");
        }

        const { lat, lng } = geoRes.results[0].geometry.location;
        const businesses = await broadAreaSearch(lat, lng, radius);

        return { success: true, businesses };
    } catch (error: any) {
        console.error("[LeadActions] Search error:", error);
        return { success: false, error: error.message };
    }
}

export async function qualifyLeadAction(lead: any, language: 'fr' | 'en' = 'fr') {
    try {
        let { place_id, name, website } = lead;

        // 1. Get Details if missing
        if (!website) {
            const details = await getPlaceDetails(place_id);
            website = details.website;
        }

        if (!website) {
            return { success: false, error: "No website found for this business" };
        }

        // 2. Scrape
        const scrapedData = await scrapeWebsite(website);

        // 3. AI Analysis
        let socialDataStr = '';
        if (scrapedData.socialProfiles?.length) {
            socialDataStr = scrapedData.socialProfiles.map(p => {
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

        const analysis = await analyzeClient(
            name,
            scrapedData.description || scrapedData.title || 'No content found',
            JSON.stringify({ emails: scrapedData.emails, title: scrapedData.title }),
            socialDataStr || undefined
        );

        const emailDraft = await draftIntroEmail(name, analysis, language);

        return {
            success: true,
            scrapedData,
            analysis: {
                ...analysis,
                email_draft: emailDraft,
            }
        };
    } catch (error: any) {
        console.error("[LeadActions] Qualification error:", error);
        return { success: false, error: error.message };
    }
}

export async function saveLeadToPipeline(lead: Lead, scrapedData?: any, analysis?: any) {
    try {
        // 1. Save Base Lead
        const leadRes = await db.execute({
            sql: `INSERT INTO leads (place_id, name, address, website, phone, rating, user_ratings_total, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, 'New')
                  ON CONFLICT(place_id) DO UPDATE SET status = status`,
            args: [lead.place_id, lead.name, lead.address, lead.website, lead.phone, lead.rating, lead.user_ratings_total]
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
                sql: `INSERT INTO lead_analyses (lead_id, summary, pain_points, suggestions, qualification_score, email_draft) 
                      VALUES (?, ?, ?, ?, ?, ?)
                      ON CONFLICT(lead_id) DO UPDATE SET summary = excluded.summary`,
                args: [
                    leadId,
                    analysis.summary,
                    JSON.stringify(analysis.painPoints || []),
                    JSON.stringify(analysis.suggestions || []),
                    analysis.qualificationScore || 0,
                    analysis.email_draft || ''
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
                la.summary, la.pain_points, la.suggestions, la.qualification_score, la.email_draft,
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
                email_draft: r.email_draft
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
