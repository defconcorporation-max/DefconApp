import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const actorId = formData.get('actorId') as string;

        if (!file || !actorId) {
            return NextResponse.json({ error: 'Missing file or actorId' }, { status: 400 });
        }

        // Upload to Vercel Blob
        const blob = await put(`actors/${actorId}/${Date.now()}-${file.name}`, file, {
            access: 'public',
        });

        return NextResponse.json({ url: blob.url, success: true });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
