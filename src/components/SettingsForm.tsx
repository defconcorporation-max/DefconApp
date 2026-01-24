'use client';

import { updateSettings } from '@/app/actions';
import { useTransition } from 'react';

export default function SettingsPage({ settings }: { settings: { tax_tps_rate: number, tax_tvq_rate: number } }) {
    return (
        <main className="min-h-screen p-8 bg-[var(--bg-root)] text-white">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="max-w-xl">
                <div className="glass-panel p-6 rounded-2xl">
                    <h2 className="text-xl font-bold mb-4 neo-gradient-text">Tax Configuration (Quebec)</h2>
                    <form action={updateSettings} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase text-gray-400 font-bold tracking-wider">TPS Rate (%)</label>
                                <div className="relative">
                                    <input
                                        name="tax_tps_rate"
                                        type="number"
                                        step="0.001"
                                        defaultValue={settings.tax_tps_rate}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-violet-500 outline-none"
                                    />
                                    <span className="absolute right-4 top-3 text-gray-500">%</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase text-gray-400 font-bold tracking-wider">TVQ Rate (%)</label>
                                <div className="relative">
                                    <input
                                        name="tax_tvq_rate"
                                        type="number"
                                        step="0.001"
                                        defaultValue={settings.tax_tvq_rate}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-violet-500 outline-none"
                                    />
                                    <span className="absolute right-4 top-3 text-gray-500">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <button className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full">
                                Save Settings
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
