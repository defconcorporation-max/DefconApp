'use client';

import { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';

// PDF Styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#1a1a1a',
    },
    header: {
        marginBottom: 30,
        borderBottom: '2px solid #7c3aed',
        paddingBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#7c3aed',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: '#6b7280',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#111',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: 5,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    statBox: {
        flex: 1,
        minWidth: '22%',
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 6,
        textAlign: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7c3aed',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 8,
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    table: {
        marginTop: 5,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #f3f4f6',
        paddingVertical: 6,
        alignItems: 'center',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 4,
        marginBottom: 2,
    },
    col1: { flex: 3, paddingLeft: 4 },
    col2: { flex: 1, textAlign: 'center' },
    col3: { flex: 2, textAlign: 'right', paddingRight: 4 },
    headerText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#9ca3af',
        borderTop: '1px solid #e5e7eb',
        paddingTop: 10,
    },
});

// PDF Document Component
function FinanceReportDocument({ data }: { data: any }) {
    const fmt = (n: number) => `$${Number(n || 0).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Rapport Financier</Text>
                    <Text style={styles.subtitle}>
                        {data.period} — Généré le {new Date(data.generatedAt).toLocaleDateString('fr-CA')}
                    </Text>
                </View>

                {/* KPIs */}
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{fmt(data.stats?.revenueWithTax)}</Text>
                        <Text style={styles.statLabel}>Revenus (TTC)</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{fmt(data.stats?.netProfit)}</Text>
                        <Text style={styles.statLabel}>Profit Net</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{fmt(data.stats?.expenses)}</Text>
                        <Text style={styles.statLabel}>Commissions</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{fmt(data.stats?.businessExpenses)}</Text>
                        <Text style={styles.statLabel}>Dépenses</Text>
                    </View>
                </View>

                {/* Tax Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Taxes</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{fmt(data.stats?.taxesOwed?.tps)}</Text>
                            <Text style={styles.statLabel}>TPS à remettre</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{fmt(data.stats?.taxesOwed?.tvq)}</Text>
                            <Text style={styles.statLabel}>TVQ à remettre</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{fmt(data.stats?.pendingRevenueWithTax)}</Text>
                            <Text style={styles.statLabel}>Revenus en attente</Text>
                        </View>
                    </View>
                </View>

                {/* Top Clients */}
                {data.topClients?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Top Clients</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.col1, styles.headerText]}>Client</Text>
                                <Text style={[styles.col2, styles.headerText]}>Projets</Text>
                                <Text style={[styles.col3, styles.headerText]}>Cash Collecté</Text>
                            </View>
                            {data.topClients.slice(0, 10).map((c: any, i: number) => (
                                <View key={i} style={styles.tableRow}>
                                    <Text style={styles.col1}>{c.company_name || c.name}</Text>
                                    <Text style={styles.col2}>{c.project_count || 0}</Text>
                                    <Text style={styles.col3}>{fmt(c.total_paid)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Footer */}
                <Text style={styles.footer}>
                    Defcon Production Hub — Rapport confidentiel
                </Text>
            </Page>
        </Document>
    );
}

// Export Button Component
export default function FinanceExportButton() {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/finance-report');
            if (!res.ok) throw new Error('Failed to fetch report data');
            const data = await res.json();

            const blob = await pdf(<FinanceReportDocument data={data} />).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rapport-financier-${data.period.replace(/\s/g, '-')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('PDF export failed:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {loading ? 'Génération...' : 'Exporter PDF'}
        </button>
    );
}
