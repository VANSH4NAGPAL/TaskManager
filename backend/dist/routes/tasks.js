"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const asyncHandler_1 = require("../utils/asyncHandler");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errors_1 = require("../utils/errors");
exports.taskRouter = (0, express_1.Router)();
const statusEnum = zod_1.z.enum(["TODO", "IN_PROGRESS", "DONE"]);
const querySchema = zod_1.z.object({
    q: zod_1.z.string().optional(),
    status: statusEnum.optional(),
    tag: zod_1.z.string().optional(),
    due: zod_1.z.string().datetime().optional(),
});
const createSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    status: statusEnum.optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional().default([]),
    dueDate: zod_1.z.string().datetime().optional(),
});
const updateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().min(1).optional(),
    status: statusEnum.optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    dueDate: zod_1.z.string().datetime().optional().nullable(),
});
exports.taskRouter.get("/", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.userId)
        throw new errors_1.HttpError(401, "Unauthorized");
    const parsedQuery = querySchema.safeParse({
        q: typeof req.query.q === "string" ? req.query.q : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined,
        tag: typeof req.query.tag === "string" ? req.query.tag : undefined,
        due: typeof req.query.due === "string" ? req.query.due : undefined,
    });
    if (!parsedQuery.success) {
        throw new errors_1.HttpError(400, "Invalid query params", parsedQuery.error.flatten().fieldErrors);
    }
    const { q, status, tag, due } = parsedQuery.data;
    console.log("Task filters received:", { q, status, tag, due, userId: req.userId });
    const tasks = await prisma_1.prisma.task.findMany({
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
}));
exports.taskRouter.post("/", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.userId)
        throw new errors_1.HttpError(401, "Unauthorized");
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new errors_1.HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
    }
    const task = await prisma_1.prisma.task.create({
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
}));
exports.taskRouter.patch("/:id", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.userId)
        throw new errors_1.HttpError(401, "Unauthorized");
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new errors_1.HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
    }
    const existing = await prisma_1.prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing)
        throw new errors_1.HttpError(404, "Task not found");
    const task = await prisma_1.prisma.task.update({
        where: { id: req.params.id },
        data: {
            ...parsed.data,
            dueDate: parsed.data.dueDate === undefined
                ? existing.dueDate
                : parsed.data.dueDate === null
                    ? null
                    : new Date(parsed.data.dueDate),
        },
    });
    res.json({ task });
}));
exports.taskRouter.delete("/:id", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.userId)
        throw new errors_1.HttpError(401, "Unauthorized");
    const existing = await prisma_1.prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing)
        throw new errors_1.HttpError(404, "Task not found");
    await prisma_1.prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).send();
}));
//# sourceMappingURL=tasks.js.map