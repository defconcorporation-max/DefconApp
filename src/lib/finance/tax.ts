/**
 * TPS + TVQ Québec : utilitaires de calcul pour passer de HT à TTC.
 * Les taux sont en pourcentage (ex. 5 et 9.975).
 */
export function taxMultiplierFromRates(tpsPercent: number, tvqPercent: number): number {
    const tps = Number.isFinite(tpsPercent) ? tpsPercent : 5;
    const tvq = Number.isFinite(tvqPercent) ? tvqPercent : 9.975;
    return 1 + (tps + tvq) / 100;
}

export function subtotalPreTaxFromLines(lines: { rate?: unknown; quantity?: unknown }[]): number {
    return lines.reduce((sum, line) => {
        const rate = Number(line.rate) || 0;
        const qty = Number(line.quantity) || 0;
        return sum + rate * qty;
    }, 0);
}

export function taxAmountsFromSubtotal(
    subtotalPreTax: number,
    tpsPercent: number,
    tvqPercent: number,
): { tps: number; tvq: number } {
    const safeTps = Number.isFinite(tpsPercent) ? tpsPercent : 5;
    const safeTvq = Number.isFinite(tvqPercent) ? tvqPercent : 9.975;
    return {
        tps: subtotalPreTax * (safeTps / 100),
        tvq: subtotalPreTax * (safeTvq / 100),
    };
}

export function totalIncTaxFromSubtotal(subtotalPreTax: number, tpsPercent: number, tvqPercent: number): number {
    const mult = taxMultiplierFromRates(tpsPercent, tvqPercent);
    return subtotalPreTax * mult;
}

