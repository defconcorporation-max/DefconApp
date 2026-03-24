/**
 * Dates « calendrier » en heure locale (évite le bug UTC où un mardi devient un lundi).
 * Ne pas utiliser toISOString().split('T')[0] pour des clés de jour affichées à l’utilisateur.
 */

/** Fuseau calendrier pour l’API / serveur (Vercel = UTC) — défaut Québec. */
export const DEFAULT_BUSINESS_TIMEZONE =
    typeof process !== 'undefined' && process.env?.BUSINESS_TIMEZONE
        ? process.env.BUSINESS_TIMEZONE
        : 'America/Toronto';

/**
 * YYYY-MM-DD pour une Date dans un fuseau IANA (ex. serveur en UTC, jour « métier » au Québec).
 */
export function formatDateKeyInTimeZone(d: Date, timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(d);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    if (!y || !m || !day) return formatDateKeyLocal(d);
    return `${y}-${m}-${day}`;
}

/** « Aujourd’hui » côté serveur : aligné sur le fuseau métier, pas sur UTC Vercel. */
export function todayDateKeyBusiness(timeZone: string = DEFAULT_BUSINESS_TIMEZONE): string {
    return formatDateKeyInTimeZone(new Date(), timeZone);
}

/** Ajoute N jours à une clé YYYY-MM-DD (arithmétique calendaire, sans heures). */
export function addDaysToDateKey(dateKey: string, days: number): string {
    const [y, mo, d] = dateKey.split('-').map(Number);
    if (!y || !mo || !d) return dateKey;
    const x = new Date(Date.UTC(y, mo - 1, d + days));
    const yy = x.getUTCFullYear();
    const mm = String(x.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(x.getUTCDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
}

export function formatDateKeyLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function todayDateKeyLocal(): string {
    return formatDateKeyLocal(new Date());
}

/** Extrait YYYY-MM-DD depuis une valeur stockée (date seule ou datetime). */
export function dateKeyFromStored(stored: string | null | undefined): string {
    if (!stored || typeof stored !== 'string') return '';
    return stored.trim().split(/[T ]/)[0] ?? '';
}

/**
 * Parse une date « date seule » YYYY-MM-DD en Date locale minuit (pas UTC).
 */
export function parseDateOnlyLocal(isoDate: string): Date {
    const key = dateKeyFromStored(isoDate);
    const [y, mo, d] = key.split('-').map(Number);
    if (!y || !mo || !d) return new Date(NaN);
    return new Date(y, mo - 1, d);
}

/**
 * Parse "YYYY-MM-DD HH:mm:ss" ou "YYYY-MM-DDTHH:mm:ss" comme **heure locale** (évite les ambiguïtés ISO).
 */
export function parseLocalDateTime(dateTimeStr: string): Date {
    const s = dateTimeStr.trim();
    // ISO avec Z / offset : interprétation JS (affichage local cohérent pour getHours/getMinutes)
    if (s.includes('T') && (s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s))) {
        const d = new Date(s);
        return Number.isFinite(d.getTime()) ? d : new Date(NaN);
    }

    const spaceIdx = s.indexOf(' ');
    const tIdx = s.indexOf('T');
    const sep = spaceIdx >= 0 ? spaceIdx : tIdx >= 0 ? tIdx : -1;
    if (sep < 0) return parseDateOnlyLocal(s);

    const datePart = s.slice(0, sep).trim();
    let timePart = s.slice(sep + 1).trim();
    timePart = timePart.replace(/Z$/i, '');
    const noMs = timePart.includes('.') ? timePart.split('.')[0] : timePart;
    const [y, mo, d] = datePart.split('-').map(Number);
    const timeBits = noMs.split(':').map((x) => Number(x));
    const hh = timeBits[0] ?? 0;
    const mm = timeBits[1] ?? 0;
    const ss = timeBits[2] ?? 0;
    if (!y || !mo || !d) return new Date(NaN);
    return new Date(y, mo - 1, d, hh, mm, ss);
}

/** Comparaison de tri pour champs shoot_date / due_date stockés en YYYY-MM-DD (ou datetime). */
export function compareStoredDateKeys(a: string, b: string): number {
    return dateKeyFromStored(a).localeCompare(dateKeyFromStored(b));
}
