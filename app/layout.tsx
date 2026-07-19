import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Matalinong Tindahan",
  description: "AI restocking assistant for sari-sari store owners",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-orange-50 text-gray-900">
        <header className="bg-brand-600 text-white px-4 py-3 shadow">
          <h1 className="text-lg font-bold">Matalinong Tindahan</h1>
        </header>
        <main className="max-w-md mx-auto px-4 py-4">{children}</main>
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 max-w-md mx-auto">
          <a href="/" className="text-sm text-gray-700 px-3 py-1">
            Dashboard
          </a>
          <a href="/log" className="text-sm text-gray-700 px-3 py-1">
            Log Sale
          </a>
          <a href="/suggestions" className="text-sm text-gray-700 px-3 py-1">
            Suggestions
          </a>
        </nav>
        <div className="h-16" />
        <Analytics />
      </body>
    </html>
  );
}
