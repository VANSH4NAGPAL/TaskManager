import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { HttpError } from "../utils/errors";

export const taskRouter = Router();

const statusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

const querySchema = z.object({
  q: z.string().optional(),
  status: statusEnum.optional(),
  tag: z.string().optional(),
  due: z.string().datetime().optional(),
});

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  status: statusEnum.optional(),
  tags: z.array(z.string()).optional().default([]),
  dueDate: z.string().datetime().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: statusEnum.optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

taskRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");

    const parsedQuery = querySchema.safeParse({
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      tag: typeof req.query.tag === "string" ? req.query.tag : undefined,
      due: typeof req.query.due === "string" ? req.query.due : undefined,
    });

    if (!parsedQuery.success) {
      throw new HttpError(400, "Invalid query params", parsedQuery.error.flatten().fieldErrors);
    }

    const { q, status, tag, due } = parsedQuery.data;

    console.log("Task filters received:", { q, status, tag, due, userId: req.userId });

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.userId,
        status,
        tags: tag ? { has: tag } : undefined,
        OR: q
          ? [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ]
          : undefined,
        dueDate: due ? { lte: new Date(due) } : undefined,
      },
      orderBy: { updatedAt: "desc" },
    });

    console.log("Tasks found:", tasks.length);

    res.json({ tasks });
  })
);

taskRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
    }

    const task = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        status: parsed.data.status ?? "TODO",
        tags: parsed.data.tags ?? [],
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        userId: req.userId,
      },
    });

    res.status(201).json({ task });
  })
);

taskRouter.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) throw new HttpError(404, "Task not found");

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...parsed.data,
        dueDate:
          parsed.data.dueDate === undefined
            ? existing.dueDate
            : parsed.data.dueDate === null
            ? null
            : new Date(parsed.data.dueDate),
      },
    });

    res.json({ task });
  })
);

taskRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.userId) throw new HttpError(401, "Unauthorized");
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) throw new HttpError(404, "Task not found");

    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
