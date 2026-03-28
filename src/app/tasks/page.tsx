import { getTasks } from '@/app/actions/task-actions';
import PageLayout from '@/components/layout/PageLayout';
import TasksBoard from '@/components/tasks/TasksBoard';
import { ListTodo } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
    const tasks = await getTasks();

    return (
        <PageLayout
            breadcrumbs={[
                { label: 'Dashboard', href: '/' },
                { label: 'Tasks' },
            ]}
            title="Task Management"
            subtitle="ClickUp-style task board connected to GHL."
            compact
        >
            <TasksBoard initialTasks={tasks} />
        </PageLayout>
    );
}
