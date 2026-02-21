import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

export const dynamic = "force-dynamic";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import CommandMenu from "@/components/CommandMenu";
import GlobalQuickCreate from "@/components/GlobalQuickCreate";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { getClients, getAgencies } from "@/app/actions";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#18181b",
};

export const metadata: Metadata = {
  title: "Defcon Console",
  description: "Managing the empire.",
};


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isPublic = pathname.startsWith('/review') || pathname.startsWith('/portal/login');

  // Get user session for role-based sidebar
  const session = isPublic ? null : await auth();
  const userRole = session?.user?.role || '';
  const isAdmin = userRole === 'Admin' || userRole === 'Team';

  let clients: any[] = [];
  let agencies: any[] = [];

  if (!isPublic && session) {
    try {
      [clients, agencies] = await Promise.all([
        getClients(),
        isAdmin ? getAgencies() : Promise.resolve([])
      ]);
    } catch (e) {
      console.error("Layout fetch error", e);
    }
  }

  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--bg-root)] text-[var(--text-primary)] flex`}>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#fff',
              border: '1px solid #3f3f46'
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#18181b',
              },
            },
          }}
        />
        {!isPublic && <Sidebar userRole={userRole} />}
        {!isPublic && <CommandMenu />}
        {!isPublic && <GlobalQuickCreate isAdmin={isAdmin} clients={clients} agencies={agencies} />}
        <div className={`flex-1 min-w-0 transition-all duration-200 ${!isPublic ? 'md:ml-64' : ''}`}>
          {children}
        </div>
      </body>
    </html>
  );
}

