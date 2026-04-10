import type { Metadata } from "next";
import "./globals.css";
import { ActingAsDropdown } from "@/components/ActingAsDropdown";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Retro Board",
  description: "Capture retrospective feedback, surface trends, drive action.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <header className="bg-indigo-700 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-lg font-bold tracking-tight hover:opacity-90">
                Retro Board
              </Link>
              <Link href="/boards/new" className="text-sm hover:underline opacity-90">
                + New Board
              </Link>
              <Link href="/insights" className="text-sm hover:underline opacity-90">
                Insights
              </Link>
            </nav>
            <ActingAsDropdown />
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
