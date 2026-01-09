"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Loader } from "../../components/ui/loader";
import { useSignup, useCurrentUser } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";
import { motion } from "framer-motion";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [user, isLoading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useSignup();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      toast.success("Welcome aboard");
      router.replace("/dashboard");
    } catch (err: any) {
      const message = err?.message || "Signup failed";
      if (message.toLowerCase().includes("already registered") || message.toLowerCase().includes("already exists")) {
        toast.error("This email is already registered. Please login instead.", {
          action: {
            label: "Go to Login",
            onClick: () => router.push("/login"),
          },
        });
      } else {
        toast.error(message);
      }
    }
  });

  return (
    <div className="min-h-screen px-6 flex items-center justify-center relative overflow-hidden">
      {/* Animated curved line background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <motion.path
          d="M -100 600 Q 300 200, 600 400 T 1200 300"
          stroke="currentColor"
          strokeWidth="80"
          fill="none"
          className="text-[--ink]"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link href="/" className="absolute top-8 left-8 z-20 px-4 py-2 text-sm font-medium text-[--ink] bg-white border border-[--border] rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow">
          ← Home
        </Link>
      </motion.div>
      <motion.div
        className="w-full max-w-sm space-y-8 relative z-10 bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-[--border] shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-[--ink]">Sign up</h1>
          <p className="text-sm text-[--muted]">Create your account to get started</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[--ink]">Name</label>
            <Input type="text" placeholder="Alex Doe" {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[--ink]">Email</label>
            <Input type="email" placeholder="you@example.com" {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[--ink]">Password</label>
            <Input type="password" placeholder="••••••••" {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <Button className="w-full" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader size="sm" />
                Creating account...
              </span>
            ) : "Sign up"}
          </Button>
        </form>

        <div className="text-sm text-[--muted] text-center">
          Already have an account? <Link href="/login" className="text-black font-medium hover:underline">Login</Link>
        </div>
      </motion.div>
    </div>
  );
}
