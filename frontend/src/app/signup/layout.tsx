import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up — Start for Free",
  description:
    "Create your free TM Dashboard account. Organize tasks, collaborate with your team, and boost productivity — no credit card required.",
  alternates: {
    canonical: "https://task-manager-ten-omega-60.vercel.app/signup",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
