import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return NextResponse.json({
                error: 'BLOB_READ_WRITE_TOKEN is not set. Go to Vercel → Storage → Create Blob Store.',
                success: false
            }, { status: 500 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'uploads';

        if (!file) {
            return NextResponse.json({ error: 'No file provided', success: false }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 10MB)', success: false }, { status: 400 });
        }

        const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
            access: 'private',
        });

        return NextResponse.json({ url: blob.url, success: true });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({
            error: error?.message || String(error),
            success: false
        }, { status: 500 });
    }
}
