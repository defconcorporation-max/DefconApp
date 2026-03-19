import { describe, expect, it } from 'vitest';
import { subtotalPreTaxFromLines, taxAmountsFromSubtotal, taxMultiplierFromRates, totalIncTaxFromSubtotal } from './tax';

describe('taxMultiplierFromRates', () => {
    it('default-ish QC rates', () => {
        const m = taxMultiplierFromRates(5, 9.975);
        expect(m).toBeCloseTo(1.14975, 5);
    });

    it('falls back when NaN', () => {
        const m = taxMultiplierFromRates(Number.NaN, Number.NaN);
        expect(m).toBeCloseTo(1.14975, 5);
    });
});

describe('subtotalPreTaxFromLines', () => {
    it('sums rate * quantity', () => {
        expect(
            subtotalPreTaxFromLines([
                { rate: 100, quantity: 2 },
                { rate: 50, quantity: 1 },
            ]),
        ).toBe(250);
    });
});

describe('totalIncTaxFromSubtotal', () => {
    it('applies multiplier', () => {
        const total = totalIncTaxFromSubtotal(1000, 5, 9.975);
        expect(total).toBeCloseTo(1149.75, 2);
    });
});

describe('taxAmountsFromSubtotal', () => {
    it('computes TPS/TVQ from HT subtotal', () => {
        const { tps, tvq } = taxAmountsFromSubtotal(1000, 5, 9.975);
        expect(tps).toBeCloseTo(50, 6);
        expect(tvq).toBeCloseTo(99.75, 6);
    });
});
