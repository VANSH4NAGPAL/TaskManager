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
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Sparkles, Users, Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

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

  const benefits = [
    "Free forever for personal use",
    "No credit card required",
    "Get started in 30 seconds",
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute top-40 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-56 h-56 bg-white/10 rounded-full blur-2xl" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <span className="text-teal-600 font-bold text-sm tracking-tighter">TM</span>
          </div>
          <span className="text-xl font-semibold text-white">TM Dashboard</span>
        </Link>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <motion.h2
            className="text-4xl font-light text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Join thousands of<br />
            <span className="font-medium">productive teams</span>
          </motion.h2>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                className="flex items-center gap-3 text-white/90"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>{benefit}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex gap-8 pt-8 border-t border-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-white/80" />
              <span className="text-white"><strong>2,000+</strong> users</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white/80" />
              <span className="text-white"><strong>50K+</strong> tasks completed</span>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <p className="text-sm text-white/60 relative z-10">
          © 2026 TM Dashboard. All rights reserved.
        </p>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-white">
        {/* Mobile back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-6 left-6"
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
        </motion.div>

        <motion.div
          className="w-full max-w-md space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#0d9488' }}
              >
                <span className="text-white font-bold text-sm tracking-tighter">TM</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">TM Dashboard</span>
            </Link>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-semibold text-gray-900">Create an account</h1>
            <p className="text-gray-600">Start organizing your tasks today</p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Name</label>
              <Input
                type="text"
                placeholder="Alex Doe"
                {...register("name")}
                aria-invalid={!!errors.name}
                className="h-12"
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                aria-invalid={!!errors.email}
                className="h-12"
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  aria-invalid={!!errors.password}
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              <p className="text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            <Button
              className="w-full h-12"
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader size="sm" />
                  Creating account...
                </span>
              ) : "Create account"}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to our{" "}
              <Link href="#" className="text-teal-600 hover:underline">Terms</Link>
              {" "}and{" "}
              <Link href="#" className="text-teal-600 hover:underline">Privacy Policy</Link>
            </p>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-teal-600 font-medium hover:underline">
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
