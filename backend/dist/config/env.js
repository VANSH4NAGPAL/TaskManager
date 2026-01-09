"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.string().default("4000"),
    DATABASE_URL: zod_1.z.string().url(),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    ACCESS_TOKEN_TTL_MINUTES: zod_1.z.string().default("15"),
    REFRESH_TOKEN_TTL_DAYS: zod_1.z.string().default("7"),
    REFRESH_COOKIE_DOMAIN: zod_1.z.string().default("localhost"),
    REFRESH_COOKIE_SECURE: zod_1.z
        .string()
        .default("false")
        .transform((v) => v === "true"),
    CORS_ORIGIN: zod_1.z.string().default("http://localhost:3000"),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default("900000"),
    RATE_LIMIT_MAX: zod_1.z.string().default("100"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
}
exports.env = {
    ...parsed.data,
    port: Number(parsed.data.PORT),
    accessTtlMs: Number(parsed.data.ACCESS_TOKEN_TTL_MINUTES) * 60 * 1000,
    refreshTtlMs: Number(parsed.data.REFRESH_TOKEN_TTL_DAYS) * 24 * 60 * 60 * 1000,
    corsOrigins: parsed.data.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean),
    rateLimitWindowMs: Number(parsed.data.RATE_LIMIT_WINDOW_MS),
    rateLimitMax: Number(parsed.data.RATE_LIMIT_MAX),
};
//# sourceMappingURL=env.js.map