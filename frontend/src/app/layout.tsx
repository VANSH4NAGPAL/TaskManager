import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers";

const BASE_URL = "https://task-manager-ten-omega-60.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "TM Dashboard — Organize Your Work, Simply",
    template: "%s | TM Dashboard",
  },
  description:
    "TM Dashboard is a free, secure task management app with real-time collaboration, Kanban boards, smart reminders, and team sharing. Get organized in seconds.",
  keywords: [
    "task manager",
    "task management app",
    "kanban board",
    "productivity app",
    "team collaboration",
    "to-do list",
    "project management",
    "free task manager",
    "TM Dashboard",
  ],
  authors: [{ name: "Vansh Nagpal", url: "https://vanshdev.netlify.app/" }],
  creator: "Vansh Nagpal",
  publisher: "TM Dashboard",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    locale: "en_US",
    siteName: "TM Dashboard",
    title: "TM Dashboard — Organize Your Work, Simply",
    description:
      "Free task management with real-time collaboration, Kanban boards, smart reminders, and team sharing. Start for free in 30 seconds.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TM Dashboard — Organize Your Work, Simply",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TM Dashboard — Organize Your Work, Simply",
    description:
      "Free task management with real-time collaboration, Kanban boards, and team sharing.",
    images: ["/opengraph-image"],
    creator: "@VanshNOk",
    site: "@VanshNOk",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: "TM Dashboard",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  category: "productivity",
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
