import { getSettings, getTaskStages } from '@/app/actions';
import { getPostProdTemplates } from '@/app/post-prod-actions';
import SettingsForm from '@/components/SettingsForm';
import TaskStageManager from '@/components/TaskStageManager';
import WorkflowManager from '@/components/settings/WorkflowManager';
import SalesPlaybookButton from '@/components/settings/SalesPlaybookButton';
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';


export const dynamic = 'force-dynamic';

export default async function Page() {
    const session = await auth();
    if (!session) redirect('/login');
    const role = session.user?.role;
    if (role !== 'Admin' && role !== 'Team') redirect('/');
    const settings = await getSettings();
    const stages = await getTaskStages();
    const templates = await getPostProdTemplates();

    return (
        <div className="flex">
            <div className="flex-1 p-8 text-white">
                <h1 className="text-2xl font-bold mb-4">Settings Debug View</h1>
                <p>If you can see this, the database fetched successfully without crashing.</p>
                <pre className="bg-black p-4 mt-4 rounded text-xs">{JSON.stringify({ settings, stages, templates }, null, 2)}</pre>
            </div>
        </div>
    );
}
