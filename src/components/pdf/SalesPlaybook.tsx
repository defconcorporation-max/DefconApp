'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register a nice font if possible, otherwise fall back to standard
// Font.register({ family: 'Inter', src: '...' }); 

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF', // Clean print-friendly white
        padding: 40,
        fontFamily: 'Helvetica',
        color: '#1a1a1a',
    },
    header: {
        marginBottom: 30,
        borderBottom: 2,
        borderBottomColor: '#6366f1', // Indigo-500
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#1a1a1a',
    },
    subtitle: {
        fontSize: 10,
        color: '#6b7280',
        marginTop: 4,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6366f1',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    subSectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#374151',
        backgroundColor: '#f3f4f6',
        padding: 4,
    },
    text: {
        fontSize: 10,
        lineHeight: 1.5,
        marginBottom: 6,
        color: '#374151',
    },
    bold: {
        fontWeight: 'bold',
        color: '#000000',
    },
    bullet: {
        fontSize: 10,
        marginLeft: 10,
        marginBottom: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
    },
    card: {
        width: '30%',
        backgroundColor: '#f9fafb',
        border: 1,
        borderColor: '#e5e7eb',
        borderRadius: 4,
        padding: 10,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#1a1a1a',
    },
    price: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#059669', // Emerald-600
        marginBottom: 6,
    },
    scriptBox: {
        borderLeft: 3,
        borderLeftColor: '#6366f1',
        backgroundColor: '#eef2ff',
        padding: 10,
        marginTop: 5,
        marginBottom: 10,
    },
    scriptLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#6366f1',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    question: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 8,
        color: '#b91c1c', // Red-700
    },
});

export const SalesPlaybook = () => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Defcon</Text>
                    <Text style={{ fontSize: 12, color: '#4b5563' }}>Sales Playbook & Pricing Guide</Text>
                </View>
                <Text style={styles.subtitle}>Confidential • Internal Use Only</Text>
            </View>

            {/* 1. Target & Hook */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. The Strategy</Text>

                <View style={{ flexDirection: 'row', gap: 20 }}>
                    <View style={{ width: '45%' }}>
                        <Text style={styles.subSectionTitle}>Create Urgency</Text>
                        <Text style={styles.text}>
                            <Text style={styles.bold}>We call:</Text> Businesses (Restaurants, Real Estate, Gyms) with noticeable gaps in quality or consistency.
                        </Text>
                        <Text style={styles.text}>
                            <Text style={styles.bold}>The Philosophy:</Text> "We don't call out of the blue. We called because we detected your marketing could be improved, and the current approach isn't the best fit."
                        </Text>
                    </View>
                    <View style={{ width: '50%', ...styles.scriptBox }}>
                        <Text style={styles.scriptLabel}>The Hook (Brutal Honesty)</Text>
                        <Text style={{ ...styles.text, fontStyle: 'italic' }}>
                            "Your marketing sucks. We can do 10x better."
                        </Text>
                        <Text style={styles.text}>
                            (Use a polite but firm professional variation: "We've analyzed your current presence and identified critical missed opportunities that are costing you leads.")
                        </Text>
                    </View>
                </View>
            </View>

            {/* 2. Video Packages */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Video Production ("The Hook")</Text>
                <Text style={styles.text}>
                    Our primary foot-in-the-door. No engagement required. We shoot, we edit, you post.
                </Text>

                <View style={{ ...styles.grid, justifyContent: 'space-between' }}>

                    {/* Test Contract */}
                    <View style={{ ...styles.card, borderColor: '#f59e0b', backgroundColor: '#fffbeb' }}>
                        <Text style={styles.cardTitle}>TEST CONTRACT</Text>
                        <Text style={styles.price}>$400 One-time</Text>
                        <Text style={styles.bullet}>• 5 Videos</Text>
                        <Text style={styles.bullet}>• Quality check</Text>
                        <Text style={styles.bullet}>• "Try before you commit"</Text>
                    </View>

                    {/* Organic */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>ORGANIQUE (Content)</Text>
                        <Text style={styles.price}>$750/mo</Text>
                        <Text style={{ fontSize: 8, color: '#6b7280', marginBottom: 4 }}>($1,700 / 3 months)</Text>
                        <Text style={styles.bullet}>• 1 Shoot (3h)</Text>
                        <Text style={styles.bullet}>• 10 Reels</Text>
                        <Text style={styles.bullet}>• 20 Photos</Text>
                        <Text style={styles.bullet}>• Simple Editing (Cuts, Subs, Music, B-roll)</Text>
                    </View>

                    {/* ADS */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>ADS (Conversion)</Text>
                        <Text style={styles.price}>$750/mo</Text>
                        <Text style={{ fontSize: 8, color: '#6b7280', marginBottom: 4 }}>($1,700 / 3 months)</Text>
                        <Text style={styles.bullet}>• 1 Shoot (3h)</Text>
                        <Text style={styles.bullet}>• 5 Scripted Ads</Text>
                        <Text style={styles.bullet}>• 20 Photos</Text>
                        <Text style={styles.bullet}>• Advanced Editing (Motion graphics, Sound design, Dynamic)</Text>
                    </View>

                    {/* COMBO */}
                    <View style={{ ...styles.card, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={styles.cardTitle}>ORGANIQUE + ADS (Growth)</Text>
                            <Text style={styles.price}>$1,200/mo ($3,250 / 3mo)</Text>
                        </View>
                        <View>
                            <Text style={styles.bullet}>• 1-2 Shoots (10h total)</Text>
                            <Text style={styles.bullet}>• 10 Reels + 5 Scripted Ads</Text>
                            <Text style={styles.bullet}>• 20-40 Photos</Text>
                            <Text style={styles.bullet}>• Advanced Editing</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* 3. Add-on Services */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Growth & Upsells</Text>
                <View style={styles.grid}>
                    <View style={{ ...styles.card, width: '48%' }}>
                        <Text style={styles.cardTitle}>SOCIAL MEDIA MANAGEMENT</Text>
                        <Text style={styles.price}>$450/mo ($1,200 / 3mo)</Text>
                        <Text style={styles.text}>We handle the posting.</Text>
                    </View>

                    <View style={{ ...styles.card, width: '48%' }}>
                        <Text style={styles.cardTitle}>ADS MANAGEMENT</Text>
                        <Text style={styles.price}>$250/mo</Text>
                        <Text style={styles.text}>Setup & Optimization (Meta/Google). Budget not included.</Text>
                    </View>

                    <View style={{ ...styles.card, width: '48%' }}>
                        <Text style={styles.cardTitle}>CRM AUTOMATION</Text>
                        <Text style={styles.price}>$2,000 Setup</Text>
                        <Text style={styles.text}>Lead organization, Email/SMS flows. (Requires client GHL subscription).</Text>
                    </View>

                    <View style={{ ...styles.card, width: '48%' }}>
                        <Text style={styles.cardTitle}>WEBSITE DEV</Text>
                        <Text style={styles.price}>Starts at $3,000</Text>
                        <Text style={styles.text}>Service sites (landing/leads). E-com volume varies price.</Text>
                    </View>
                </View>
            </View>

            {/* 4. Scripts & Objections */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. Objection Handling</Text>

                <View style={styles.scriptBox}>
                    <Text style={styles.question}>"We already have someone."</Text>
                    <Text style={styles.text}>
                        "We don't call randomly. We noticed your marketing has room for improvement. The person in charge right now might not be the best fit for the level of growth you want."
                    </Text>

                    <Text style={styles.question}>"It's too expensive."</Text>
                    <Text style={styles.text}>
                        "We are actually priced very competitively because we base our reputation on results, not false promises. Compare our 'Organic + Ads' package to hiring a full-time employee."
                    </Text>

                    <Text style={styles.question}>"What is Simple vs Advanced editing?"</Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>Simple:</Text> Basic cuts, subtitles, music, B-roll. Clean and professional.
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>Advanced:</Text> Dynamic pacing, motion graphics, sound effects, stock footage overlay. Designed to stop the scroll.
                    </Text>
                </View>
            </View>

            {/* 5. Closing */}
            <View style={{ ...styles.section, borderTop: 1, borderTopColor: '#e5e7eb', paddingTop: 20 }}>
                <Text style={styles.sectionTitle}>5. The Close</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ width: '60%' }}>
                        <Text style={styles.text}>
                            1. <Text style={styles.bold}>Book the Shoot Date:</Text> This is the commitment.
                        </Text>
                        <Text style={styles.text}>
                            2. <Text style={styles.bold}>Secure Deposit:</Text> Target 50% upfront to lock the date (flexible if needed to close).
                        </Text>
                        <Text style={styles.text}>
                            3. <Text style={styles.bold}>No Long Contracts:</Text> "We earn your business every month."
                        </Text>
                    </View>
                    <View style={{ width: '35%', backgroundColor: '#f0fdf4', padding: 15, borderRadius: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#15803d' }}>GOAL</Text>
                        <Text style={{ fontSize: 10, textAlign: 'center', color: '#15803d' }}>Get the foot in the door with Video Content.</Text>
                    </View>
                </View>
            </View>

        </Page>
    </Document>
);
