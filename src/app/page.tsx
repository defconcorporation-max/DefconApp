import { getClients, createClient, getAllShoots, getDashboardStats, getPipelineStages, getAllDashboardTasks, DashboardTask } from './actions';
import Link from 'next/link';
import DashboardCalendar from '@/components/DashboardCalendar';
import ClientKanban from '@/components/ClientKanban';
import TaskManager from '@/components/TaskManager';

export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <div className="min-h-screen p-8 text-white flex items-center justify-center">
      <h1 className="text-4xl font-bold">Hello World - System Operational 🟢</h1>
      <p className="mt-4">If you see this, the routing works. The DB calls were the problem.</p>
    </div>
  );
}
