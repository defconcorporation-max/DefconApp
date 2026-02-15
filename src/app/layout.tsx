import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

export const dynamic = "force-dynamic";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import CommandMenu from "@/components/CommandMenu";
import { headers } from "next/headers";

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

  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--bg-root)] text-[var(--text-primary)] flex`}>
        {!isPublic && <Sidebar />}
        {!isPublic && <CommandMenu />}
        <div className={`flex-1 min-w-0 transition-all duration-200 ${!isPublic ? 'md:ml-64' : ''}`}>
          {children}
        </div>
      </body>
    </html>
  );
}

