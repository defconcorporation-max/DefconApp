import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CommandMenu from "@/components/CommandMenu";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} bg-[var(--bg-root)] text-[var(--text-primary)]`}>
        {/* <CommandMenu /> */}
        {children}
      </body>
    </html>
  );
}
