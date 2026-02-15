'use client';

import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ShootPlanPDFProps {
    shootId: number;
    shootTitle: string;
    clientName: string;
    shootDate: string;
    concept?: string;
    mood?: string;
    shotList?: string; // JSON
}

export default function ShootPlanPDF({ shootId, shootTitle, clientName, shootDate, concept, mood, shotList }: ShootPlanPDFProps) {
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            // Build a nicely formatted HTML doc from the data
            const shots = shotList ? JSON.parse(shotList) : [];

            const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Shoot Plan - ${shootTitle}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: #fff;
            color: #111;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
        }
        
        .header {
            border-bottom: 3px solid #111;
            padding-bottom: 24px;
            margin-bottom: 32px;
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header .meta {
            display: flex;
            gap: 24px;
            color: #666;
            font-size: 14px;
        }
        
        .header .meta span {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .section {
            margin-bottom: 32px;
        }
        
        .section h2 {
            font-size: 18px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #444;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ddd;
        }
        
        .section p, .section .content {
            font-size: 14px;
            line-height: 1.7;
            color: #333;
            white-space: pre-wrap;
        }
        
        .shot-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        
        .shot-table th {
            background: #f5f5f5;
            text-align: left;
            padding: 10px 12px;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #666;
            border-bottom: 2px solid #ddd;
        }
        
        .shot-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
        }
        
        .shot-table tr:last-child td {
            border-bottom: none;
        }
        
        .shot-number {
            font-weight: 700;
            color: #999;
            width: 40px;
        }
        
        .shot-type {
            display: inline-block;
            background: #f0f0f0;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
        }
        
        .completed {
            text-decoration: line-through;
            color: #999;
        }
        
        .check {
            color: #10b981;
            font-weight: 700;
        }
        
        .footer {
            margin-top: 48px;
            padding-top: 16px;
            border-top: 1px solid #ddd;
            font-size: 11px;
            color: #999;
            text-align: center;
        }
        
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${shootTitle}</h1>
        <div class="meta">
            <span><strong>Client:</strong> ${clientName}</span>
            <span><strong>Date:</strong> ${new Date(shootDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
    </div>

    ${concept ? `
    <div class="section">
        <h2>Concept / Directives</h2>
        <div class="content">${concept}</div>
    </div>
    ` : ''}

    ${mood ? `
    <div class="section">
        <h2>Mood & Tone</h2>
        <div class="content">${mood}</div>
    </div>
    ` : ''}

    ${shots.length > 0 ? `
    <div class="section">
        <h2>Shot List (${shots.filter((s: any) => s.completed).length}/${shots.length} completed)</h2>
        <table class="shot-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Status</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Type</th>
                </tr>
            </thead>
            <tbody>
                ${shots.map((shot: any, i: number) => `
                <tr>
                    <td class="shot-number">${i + 1}</td>
                    <td>${shot.completed ? '<span class="check">✓</span>' : '○'}</td>
                    <td class="${shot.completed ? 'completed' : ''}">${shot.title || '—'}</td>
                    <td class="${shot.completed ? 'completed' : ''}">${shot.description || '—'}</td>
                    <td><span class="shot-type">${shot.type || 'Wide'}</span></td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="footer">
        Defcon Agency — Shoot Plan generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
</body>
</html>`;

            // Open in new window and trigger print (saves as PDF)
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                // Give fonts time to load
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            }
        } catch (e) {
            console.error('PDF generation failed:', e);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-white/30 text-[var(--text-secondary)] hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            Export PDF
        </button>
    );
}
