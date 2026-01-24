
'use client';

import { addCredential } from '@/app/actions';
import { useState } from 'react';

export default function CredentialsBox({ clientId, credentials }: { clientId: number, credentials: any[] }) {
    const [visible, setVisible] = useState<number[]>([]);

    const toggle = (id: number) => {
        setVisible(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 neo-gradient-text">Credentials</h3>

            <div className="space-y-3 mb-6">
                {credentials.map((c: any) => (
                    <div key={c.id} className="p-3 bg-white/5 rounded-lg border border-white/5 text-sm">
                        <div className="flex justify-between mb-1">
                            <span className="font-bold text-gray-300">{c.service_name}</span>
                            <button onClick={() => toggle(c.id)} className="text-xs text-violet-400 hover:text-violet-300">
                                {visible.includes(c.id) ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-1">
                            <span className="text-gray-500 text-xs uppercase">User</span>
                            <span className="font-mono text-gray-300 select-all">{c.username}</span>

                            <span className="text-gray-500 text-xs uppercase">Pass</span>
                            <span className="font-mono text-gray-300 select-all tracking-wider">
                                {visible.includes(c.id) ? c.password : '••••••••••••'}
                            </span>
                        </div>
                    </div>
                ))}
                {credentials.length === 0 && <p className="text-gray-500 text-sm">No credentials saved.</p>}
            </div>

            <form action={addCredential} className="space-y-2 text-sm">
                <input type="hidden" name="clientId" value={clientId} />
                <input name="service" placeholder="Service (e.g. Meta Business)" className="w-full bg-black/40 border border-white/10 p-2 rounded focus:outline-none focus:border-violet-500" required />
                <div className="grid grid-cols-2 gap-2">
                    <input name="username" placeholder="Username" className="bg-black/40 border border-white/10 p-2 rounded focus:outline-none focus:border-violet-500" />
                    <input name="password" placeholder="Password" className="bg-black/40 border border-white/10 p-2 rounded focus:outline-none focus:border-violet-500" />
                </div>
                <button className="w-full bg-white/10 hover:bg-white/20 py-2 rounded transition-colors font-medium">Save Credential</button>
            </form>
        </div>
    );
}
