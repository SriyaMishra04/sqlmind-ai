import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SQLMind AI - AI-Powered SQL Assistant",
  description: "Upload any database (SQLite, CSV, Excel, or SQL dump) and let AI generate, validate, and execute SQL queries instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-slate-50 text-gray-900`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-gray-900">{children}</body>
    </html>
  );
}
