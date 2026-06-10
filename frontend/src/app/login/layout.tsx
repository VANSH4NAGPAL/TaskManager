import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Log in to TM Dashboard to access your tasks, Kanban boards, and team collaboration tools.",
  alternates: {
    canonical: "https://task-manager-ten-omega-60.vercel.app/login",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
