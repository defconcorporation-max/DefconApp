import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

export const dynamic = "force-dynamic";

import "./globals.css";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--bg-root)] text-[var(--text-primary)] flex`}>
        {/* <Sidebar /> */}
        {/* <CommandMenu /> */}
        <div className="flex-1 min-w-0 md:ml-64 transition-all duration-200">
          {children}
        </div>
      </body>
    </html>
  );
}
