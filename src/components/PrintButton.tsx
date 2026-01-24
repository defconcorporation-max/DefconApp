'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="fixed bottom-8 right-8 bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-colors print:hidden flex items-center gap-2"
        >
            <Printer size={20} />
            <span className="font-bold pr-2">Print</span>
        </button>
    );
}
