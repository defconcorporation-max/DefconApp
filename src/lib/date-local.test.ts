import { describe, expect, it } from 'vitest';
import { dateKeyFromStored, formatDateKeyLocal, parseDateOnlyLocal } from './date-local';

describe('parseDateOnlyLocal', () => {
    it('interprets YYYY-MM-DD as local calendar day (not UTC midnight)', () => {
        const d = parseDateOnlyLocal('2025-06-10');
        expect(d.getFullYear()).toBe(2025);
        expect(d.getMonth()).toBe(5); // June
        expect(d.getDate()).toBe(10);
    });
});

describe('dateKeyFromStored', () => {
    it('extracts date part from datetime strings', () => {
        expect(dateKeyFromStored('2025-03-18 14:30:00')).toBe('2025-03-18');
        expect(dateKeyFromStored('2025-03-18T14:30:00')).toBe('2025-03-18');
    });
});

describe('formatDateKeyLocal', () => {
    it('formats local date without UTC shift', () => {
        const d = new Date(2025, 5, 10); // June 10 local
        expect(formatDateKeyLocal(d)).toBe('2025-06-10');
    });
});
