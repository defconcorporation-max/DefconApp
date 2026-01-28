'use server';

import { turso as db } from '@/lib/turso';

export interface SearchResult {
    id: string;
    type: 'Page' | 'Client' | 'Project' | 'Shoot' | 'Action';
    label: string;
    subLabel?: string;
    url: string;
}

export async function getGlobalSearchData(): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // 1. Static Pages
    const pages: SearchResult[] = [
        { id: 'page-dashboard', type: 'Page', label: 'Dashboard', url: '/' },
        { id: 'page-finance', type: 'Page', label: 'Finance', url: '/finance' },
        { id: 'page-team', type: 'Page', label: 'Team', url: '/team' },
        { id: 'page-settings', type: 'Page', label: 'Settings', url: '/settings' },
        { id: 'page-services', type: 'Page', label: 'Services Catalog', url: '/services' },
        { id: 'page-post', type: 'Page', label: 'Post-Production', url: '/post-production' },
        { id: 'page-social', type: 'Page', label: 'Social Media', url: '/social' },
    ];
    results.push(...pages);

    try {
        // 2. Clients
        const clientsRes = await db.execute("SELECT id, name, company_name FROM clients ORDER BY created_at DESC LIMIT 50");
        const clients = clientsRes.rows as any[];
        clients.forEach(c => {
            results.push({
                id: `client-${c.id}`,
                type: 'Client',
                label: c.company_name || c.name,
                subLabel: c.company_name ? c.name : undefined,
                url: `/clients/${c.id}`
            });
        });

        // 3. Projects
        const projectsRes = await db.execute("SELECT id, title, status FROM projects ORDER BY created_at DESC LIMIT 50");
        const projects = projectsRes.rows as any[];
        projects.forEach(p => {
            results.push({
                id: `project-${p.id}`,
                type: 'Project',
                label: p.title,
                subLabel: p.status,
                url: `/projects/${p.id}`
            });
        });

        // 4. Shoots
        const shootsRes = await db.execute(`
            SELECT s.id, s.title, s.shoot_date, c.company_name 
            FROM shoots s
            LEFT JOIN clients c ON s.client_id = c.id
            ORDER BY s.shoot_date DESC LIMIT 50
        `);
        const shoots = shootsRes.rows as any[];

        shoots.forEach(s => {
            results.push({
                id: `shoot-${s.id}`,
                type: 'Shoot',
                label: s.title,
                subLabel: `${s.shoot_date} • ${s.company_name || 'No Client'}`,
                url: `/shoots/${s.id}`
            });
        });
    } catch (error) {
        console.warn('Search data fetch failed:', error);
        // Continue with just static pages if DB fails
    }

    return results;
}
