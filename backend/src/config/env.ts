import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("4000"),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_MINUTES: z.string().default("15"),
  REFRESH_TOKEN_TTL_DAYS: z.string().default("7"),
  REFRESH_COOKIE_DOMAIN: z.string().default("localhost"),
  REFRESH_COOKIE_SECURE: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  RATE_LIMIT_WINDOW_MS: z.string().default("900000"),
  RATE_LIMIT_MAX: z.string().default("100"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = {
  ...parsed.data,
  port: Number(parsed.data.PORT),
  accessTtlMs: Number(parsed.data.ACCESS_TOKEN_TTL_MINUTES) * 60 * 1000,
  refreshTtlMs: Number(parsed.data.REFRESH_TOKEN_TTL_DAYS) * 24 * 60 * 60 * 1000,
  corsOrigins: parsed.data.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean),
  rateLimitWindowMs: Number(parsed.data.RATE_LIMIT_WINDOW_MS),
  rateLimitMax: Number(parsed.data.RATE_LIMIT_MAX),
};
