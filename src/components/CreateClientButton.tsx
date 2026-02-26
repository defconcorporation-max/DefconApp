'use client';

export default function CreateClientButton() {
    return (
        <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-quick-create', { detail: 'client' }))}
            className="pro-button-primary flex items-center gap-2 text-sm shadow-lg shadow-indigo-500/20"
        >
            <span className="text-lg leading-none">+</span> Create Client
        </button>
    );
}
