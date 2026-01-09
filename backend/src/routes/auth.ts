import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import {
  clearRefreshCookie,
  getRefreshCookieName,
  loginUser,
  refreshTokens,
  registerUser,
  setRefreshCookie,
} from "../services/authService";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/errors";

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
    }

    const tokens = await registerUser(parsed.data);
    setRefreshCookie(res, tokens.refreshToken);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: parsed.data.email }, select: { id: true, name: true, email: true } });
    res.status(201).json({ user, accessToken: tokens.accessToken });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
    }

    const tokens = await loginUser(parsed.data);
    setRefreshCookie(res, tokens.refreshToken);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: parsed.data.email }, select: { id: true, name: true, email: true } });
    res.json({ user, accessToken: tokens.accessToken });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies[getRefreshCookieName()];
    const tokens = refreshTokens(refreshToken);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ accessToken: tokens.accessToken });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    clearRefreshCookie(res);
    res.status(204).send();
  })
);
