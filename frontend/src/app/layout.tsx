import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TM Dashboard - Organize Your Work Simply",
    template: "%s | TM Dashboard",
  },
  description: "A minimal task management dashboard with secure authentication. Organize your tasks, track progress, and boost productivity.",
  keywords: ["task management", "dashboard", "productivity", "tasks", "project management", "todo"],
  authors: [{ name: "Vansh Nagpal" }],
  creator: "Vansh Nagpal",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TM Dashboard",
    title: "TM Dashboard - Organize Your Work Simply",
    description: "A minimal task management dashboard with secure authentication.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TM Dashboard - Organize Your Work Simply",
    description: "A minimal task management dashboard with secure authentication.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
