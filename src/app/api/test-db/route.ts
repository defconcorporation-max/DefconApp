import { NextResponse } from 'next/server';
import { getShootVolumeData, getProjectOriginData, getProjectCompletionData, getSettings, getTaskStages } from '@/app/actions';
import { getPostProdTemplates } from '@/app/post-prod-actions';

export async function GET() {
    try {
        const results: any = {};

        try {
            results.volume = await getShootVolumeData();
        } catch (e: any) { results.volumeError = e.message; }

        try {
            results.origin = await getProjectOriginData();
        } catch (e: any) { results.originError = e.message; }

        try {
            results.completion = await getProjectCompletionData();
        } catch (e: any) { results.completionError = e.message; }

        try {
            results.settings = await getSettings();
        } catch (e: any) { results.settingsError = e.message; }

        try {
            results.taskStages = await getTaskStages();
        } catch (e: any) { results.taskStagesError = e.message; }

        try {
            results.postProdTemplates = await getPostProdTemplates();
        } catch (e: any) { results.postProdTemplatesError = e.message; }

        return NextResponse.json(results);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
