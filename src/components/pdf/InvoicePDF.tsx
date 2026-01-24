import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Project, Client, ProjectService, Settings } from '@/types';

// Register fonts if needed, otherwise use standard fonts
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        color: '#111827',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 20,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    invoiceTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    invoiceNumber: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    column: {
        flexDirection: 'column',
        width: '45%',
    },
    label: {
        fontSize: 9,
        color: '#6B7280',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    text: {
        fontSize: 10,
        marginBottom: 2,
    },
    table: {
        marginTop: 20,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    colDescription: { width: '50%', fontSize: 9 },
    colRate: { width: '15%', fontSize: 9, textAlign: 'right' },
    colQty: { width: '15%', fontSize: 9, textAlign: 'right' },
    colTotal: { width: '20%', fontSize: 9, textAlign: 'right' },

    totals: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginTop: 20,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '40%',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 10,
        color: '#6B7280',
    },
    totalValue: {
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    grandTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '40%',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4F46E5',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        fontSize: 9,
        color: '#9CA3AF',
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 20,
    },
});

interface InvoicePDFProps {
    project: Project;
    client: Client;
    services: ProjectService[];
    settings: Settings;
    invoiceNumber: string;
    date: string;
}

export const InvoicePDF = ({ project, client, services, settings, invoiceNumber, date }: InvoicePDFProps) => {
    // Calculate totals
    const subtotal = services.reduce((acc, s) => acc + (s.rate * s.quantity), 0);
    const tps = subtotal * (settings.tax_tps_rate / 100);
    const tvq = subtotal * (settings.tax_tvq_rate / 100);
    const total = subtotal + tps + tvq;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.logoText}>DEFCON MEDIA</Text>
                        <Text style={[styles.text, { marginTop: 8 }]}>Production & Post-Production</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        <Text style={styles.invoiceNumber}>#{invoiceNumber}</Text>
                        <Text style={[styles.text, { marginTop: 4 }]}>{date}</Text>
                    </View>
                </View>

                {/* Billing Info */}
                <View style={styles.section}>
                    <View style={styles.column}>
                        <Text style={styles.label}>FROM</Text>
                        <Text style={[styles.text, { fontWeight: 'bold' }]}>Defcon Media</Text>
                        <Text style={styles.text}>4200 Saint-Laurent</Text>
                        <Text style={styles.text}>Montreal, QC, H2W 2R2</Text>
                        <Text style={styles.text}>tax numbers here...</Text>
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.label}>TO CLIENT</Text>
                        <Text style={[styles.text, { fontWeight: 'bold' }]}>{client.company_name}</Text>
                        <Text style={styles.text}>{client.name}</Text>
                        {/* <Text style={styles.text}>client address if avail</Text> */}
                    </View>
                </View>

                {/* Project Info */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={styles.label}>PROJECT</Text>
                    <Text style={styles.text}>{project.title}</Text>
                </View>

                {/* Services Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colDescription}>DESCRIPTION</Text>
                        <Text style={styles.colRate}>RATE</Text>
                        <Text style={styles.colQty}>QTY</Text>
                        <Text style={styles.colTotal}>AMOUNT</Text>
                    </View>
                    {services.map((service, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.colDescription}>{service.name}</Text>
                            <Text style={styles.colRate}>{formatCurrency(service.rate)}</Text>
                            <Text style={styles.colQty}>{service.quantity}</Text>
                            <Text style={styles.colTotal}>{formatCurrency(service.rate * service.quantity)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totals}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal</Text>
                        <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TPS ({settings.tax_tps_rate}%)</Text>
                        <Text style={styles.totalValue}>{formatCurrency(tps)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TVQ ({settings.tax_tvq_rate}%)</Text>
                        <Text style={styles.totalValue}>{formatCurrency(tvq)}</Text>
                    </View>
                    <View style={styles.grandTotal}>
                        <Text style={[styles.totalLabel, { fontWeight: 'bold', color: '#111827' }]}>Total Due</Text>
                        <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Thank you for your business. Terms: Net 30.</Text>
                    <Text style={{ marginTop: 4 }}>Please send payments to info@defconmedia.ca</Text>
                </View>
            </Page>
        </Document>
    );
};
