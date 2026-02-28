import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedData {
    emails: string[];
    description: string;
    title: string;
    socialLinks: string[];
    socialProfiles?: SocialProfile[];
}

export interface SocialProfile {
    platform: string;
    url: string;
    username?: string;
    name?: string;
    bio?: string;
    followers?: string;
    postsCount?: string;
    postsHint?: string;
    recentPostSnippet?: string;
    contentMix?: string; // New: e.g., "Mostly Videos", "3:1 Pic/Vid"
    recency?: string;    // New: e.g., "12 weeks ago"
    scraped: boolean; // whether we got real data
}

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            },
        });

        const $ = cheerio.load(response.data);
        const bodyText = $('body').text();
        const baseUrl = new URL(url).origin;

        // 1. Extract emails from text
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        let emails = Array.from(new Set(bodyText.match(emailRegex) || []));

        // 2. Extract social links, mailto links, and potential contact pages
        const socialLinks: string[] = [];
        const contactPages: string[] = [];

        $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (!href) return;

            // Extract mailto
            if (href.toLowerCase().startsWith('mailto:')) {
                const email = href.substring(7).split('?')[0].trim();
                if (email && emailRegex.test(email)) {
                    emails.push(email);
                }
            }

            // Extract socials
            if (href.includes('facebook.com') ||
                href.includes('instagram.com') ||
                href.includes('linkedin.com') ||
                href.includes('twitter.com') ||
                href.includes('x.com') ||
                href.includes('tiktok.com') ||
                href.includes('youtube.com')) {
                socialLinks.push(href);
            }

            // Look for contact pages
            const lowerHref = href.toLowerCase();
            if (lowerHref.includes('contact') || lowerHref.includes('about') || lowerHref.includes('a-propos') || lowerHref.includes('nous-joindre')) {
                try {
                    const fullUrl = new URL(href, baseUrl).href;
                    if (fullUrl.startsWith(baseUrl)) {
                        contactPages.push(fullUrl);
                    }
                } catch {
                    // Invalid URL, skip
                }
            }
        });

        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || '';
        const uniqueSocialLinks = Array.from(new Set(socialLinks));
        const uniqueContactPages = Array.from(new Set(contactPages)).slice(0, 3); // Max 3 contact pages

        // 3. If no emails found, crawl contact pages
        if (emails.length === 0 && uniqueContactPages.length > 0) {
            for (const contactUrl of uniqueContactPages) {
                try {
                    const contactRes = await axios.get(contactUrl, {
                        timeout: 5000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                        },
                    });
                    const $contact = cheerio.load(contactRes.data);

                    // Body text emails
                    const contactEmails = $contact('body').text().match(emailRegex) || [];
                    emails.push(...contactEmails);

                    // Mailto links
                    $contact('a[href^="mailto:"]').each((_, el) => {
                        const href = $contact(el).attr('href');
                        if (href) {
                            const email = href.substring(7).split('?')[0].trim();
                            if (email && emailRegex.test(email)) emails.push(email);
                        }
                    });

                    // If we found some, stop crawling
                    if (emails.length > 0) break;
                } catch (e) {
                    // Ignore errors on subpages
                }
            }
        }

        // Clean up emails (remove duplicates and fake image extensions)
        // Clean up emails (remove duplicates, fake image extensions, and junk domains)
        const junkDomains = ['sentry', 'wixpress.com', 'example.com', 'yourdomain.com', 'email.com'];
        emails = Array.from(new Set(emails))
            .filter(e => {
                const lower = e.toLowerCase();
                // Filter out fake image extensions
                if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp')) return false;
                // Filter out tracking/junk domains
                if (junkDomains.some(junk => lower.includes(junk))) return false;
                // Filter out insanely long local parts (often hashes like Sentry traces)
                const localPart = lower.split('@')[0];
                if (localPart && localPart.length > 35) return false;
                return true;
            })
            .map(e => e.toLowerCase());

        const socialContextFromSite = extractSocialContextFromSite($, bodyText);
        const socialProfiles = await buildSocialProfiles(uniqueSocialLinks);

        return {
            emails,
            title,
            description: description + (socialContextFromSite ? `\n\nSocial context from website: ${socialContextFromSite}` : ''),
            socialLinks: uniqueSocialLinks,
            socialProfiles,
        };
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return {
            emails: [],
            title: '',
            description: '',
            socialLinks: [],
        };
    }
}

function extractSocialContextFromSite($: cheerio.CheerioAPI, bodyText: string): string {
    const hints: string[] = [];

    // Look for social widgets, follow buttons, embedded feeds
    const iframes = $('iframe[src]').toArray();
    for (const iframe of iframes) {
        const src = $(iframe).attr('src') || '';
        if (src.includes('facebook.com/plugins')) hints.push('Has embedded Facebook widget');
        if (src.includes('instagram.com/embed')) hints.push('Has embedded Instagram feed');
        if (src.includes('youtube.com/embed')) hints.push('Has embedded YouTube videos');
    }

    // Check for social proof text
    const lowerText = bodyText.toLowerCase();
    if (lowerText.includes('suivez-nous') || lowerText.includes('follow us')) hints.push('Has "Follow us" section');
    if (lowerText.includes('nos réalisations') || lowerText.includes('our work') || lowerText.includes('portfolio')) hints.push('Has portfolio/work section');
    if (lowerText.includes('témoignage') || lowerText.includes('testimonial') || lowerText.includes('avis')) hints.push('Has testimonials');
    if (lowerText.includes('blog') || lowerText.includes('actualités') || lowerText.includes('news')) hints.push('Has blog/news section');

    return hints.join('. ');
}

function extractUsername(url: string, platform: string): string | undefined {
    try {
        const cleaned = url.replace(/\/$/, '').replace(/\?.*$/, '');
        const parts = cleaned.split('/');
        const last = parts[parts.length - 1];

        // Skip generic pages
        if (['', 'profile.php', 'pages', 'channel', 'user'].includes(last)) {
            // Try second to last
            if (parts.length > 1) return parts[parts.length - 2];
            return undefined;
        }

        // For Facebook, handle /pages/Name/ID format
        if (platform === 'Facebook' && parts.includes('pages') && parts.length > parts.indexOf('pages') + 1) {
            return parts[parts.indexOf('pages') + 1];
        }

        return last || undefined;
    } catch {
        return undefined;
    }
}

function detectPlatform(url: string): string {
    if (url.includes('facebook.com')) return 'Facebook';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'X/Twitter';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('youtube.com')) return 'YouTube';
    return 'Other';
}

async function buildSocialProfiles(urls: string[]): Promise<SocialProfile[]> {
    const profiles: SocialProfile[] = [];

    const tasks = urls.map(async (url) => {
        const platform = detectPlatform(url);
        if (platform === 'Other') return null;

        const username = extractUsername(url, platform);

        const profile: SocialProfile = {
            platform,
            url,
            username,
            scraped: false,
        };

        // Try a light scrape for meta tags only (fast, often works)
        try {
            const response = await axios.get(url, {
                timeout: 6000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    'Accept': 'text/html',
                    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                },
                maxRedirects: 3,
                validateStatus: (status) => status < 400,
            });

            const $ = cheerio.load(response.data);

            profile.name = $('meta[property="og:title"]').attr('content')
                || $('meta[name="twitter:title"]').attr('content')
                || $('title').text().trim()
                || undefined;

            profile.bio = $('meta[property="og:description"]').attr('content')
                || $('meta[name="description"]').attr('content')
                || $('meta[name="twitter:description"]').attr('content')
                || undefined;

            // Platform specific extraction
            if (platform === 'Instagram') {
                const desc = profile.bio || '';
                const postsMatch = desc.match(/([\d,.]+)\s*(Posts|Publications)/i);
                if (postsMatch) profile.postsCount = postsMatch[1];

                if (desc.includes('See Instagram photos and videos')) {
                    profile.recentPostSnippet = "Account is public, images and captions available.";
                }

                // Mix & Recency hints from Instagram meta
                if (desc.includes('Reels') || desc.includes('videos')) {
                    profile.contentMix = desc.includes('Photos') ? "Mix of Photos & Reels" : "Mostly Reels/Video";
                }
            }

            if (platform === 'Facebook') {
                const desc = profile.bio || '';
                const likesMatch = desc.match(/([\d,.]+[KkMm]?)\s*(likes|mentions j'aime)/i);
                if (likesMatch) profile.followers = `${likesMatch[1]} likes`;

                if (desc.includes('vidéos') || desc.includes('videos')) {
                    profile.contentMix = "Video content detected";
                }
            }

            // Extract follower/like hints from meta descriptions if not yet set
            if (profile.bio) {
                const followMatch = profile.bio.match(/([\d,.]+[KkMm]?)\s*(followers|abonnés|Followers|Abonnés)/i);
                if (followMatch && !profile.followers) profile.followers = followMatch[1];

                const postsMatch = profile.bio.match(/([\d,.]+)\s*(posts|publications|Posts|Publications)/i);
                if (postsMatch && !profile.postsCount) profile.postsCount = postsMatch[1];

                // General recency check from meta text (rare but happens in some crawlers' cache)
                const recencyMatch = profile.bio.match(/(\d+)\s*(days|weeks|months|jours|semaines|mois)\s*ago/i);
                if (recencyMatch) profile.recency = `${recencyMatch[1]} ${recencyMatch[1]} ago`;
            }

            // Look for "last post" or date clues in the body text snippet
            const pageText = response.data.substring(0, 5000);
            const dateMatch = pageText.match(/(\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre))/i);
            if (dateMatch && !profile.recency) {
                profile.recency = `Around ${dateMatch[1]}`;
            }

            profile.scraped = true;
        } catch {
            profile.scraped = false;
        }

        return profile;
    });

    const results = await Promise.all(tasks);
    for (const p of results) {
        if (p) profiles.push(p);
    }

    return profiles;
}
