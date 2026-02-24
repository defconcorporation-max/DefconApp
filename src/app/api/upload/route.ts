import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // Check if Blob token is configured
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return NextResponse.json({
                error: 'BLOB_READ_WRITE_TOKEN is not configured. Go to Vercel Dashboard → Storage → Create Blob Store to set it up.',
                success: false
            }, { status: 500 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'uploads';

        if (!file) {
            return NextResponse.json({ error: 'No file provided', success: false }, { status: 400 });
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 10MB)', success: false }, { status: 400 });
        }

        // Upload to Vercel Blob
        const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
            access: 'public',
        });

        return NextResponse.json({ url: blob.url, success: true });
    } catch (error: any) {
        console.error('Upload error:', error);
        const message = error?.message || String(error);

        // Provide helpful error messages
        if (message.includes('BLOB_READ_WRITE_TOKEN') || message.includes('token')) {
            return NextResponse.json({
                error: 'Vercel Blob is not configured. Go to Vercel Dashboard → Storage → Create Blob Store.',
                success: false
            }, { status: 500 });
        }

        return NextResponse.json({ error: message, success: false }, { status: 500 });
    }
}
