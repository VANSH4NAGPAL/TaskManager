import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { HttpError } from "../utils/errors";

const REFRESH_COOKIE_NAME = "refresh_token";

export async function registerUser(params: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) {
    throw new HttpError(409, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(params.password, 10);
  const user = await prisma.user.create({
    data: { name: params.name, email: params.email, hashedPassword },
  });

  return issueAuth(user.id);
}

export async function loginUser(params: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: params.email } });
  if (!user) {
    throw new HttpError(401, "Invalid credentials");
  }

  const valid = await bcrypt.compare(params.password, user.hashedPassword);
  if (!valid) {
    throw new HttpError(401, "Invalid credentials");
  }

  return issueAuth(user.id);
}

export function refreshTokens(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new HttpError(401, "Missing refresh token");
  }

  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
    return issueAuth(payload.sub);
  } catch (err) {
    throw new HttpError(401, "Invalid refresh token");
  }
}

export function issueAuth(userId: string) {
  const accessToken = jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`,
  });

  const refreshToken = jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
  });

  return { accessToken, refreshToken };
}

export function setRefreshCookie(res: import("express").Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.REFRESH_COOKIE_SECURE,
    domain: env.REFRESH_COOKIE_DOMAIN,
    maxAge: env.refreshTtlMs,
    path: "/",
  });
}

export function clearRefreshCookie(res: import("express").Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.REFRESH_COOKIE_SECURE,
    domain: env.REFRESH_COOKIE_DOMAIN,
    path: "/",
  });
}

export const getRefreshCookieName = () => REFRESH_COOKIE_NAME;
