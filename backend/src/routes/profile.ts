import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { HttpError } from "../utils/errors";

export const profileRouter = Router();

const updateSchema = z.object({
  name: z.string().min(2).optional(),
});

profileRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new HttpError(404, "User not found");
    res.json({ user });
  })
);

profileRouter.patch(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: parsed.data,
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });
    res.json({ user: updated });
  })
);
