import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { HttpError } from "../utils/errors";
import { createNotification } from "./notifications";

export const shareRouter = Router();

const permissionEnum = z.enum(["VIEWER", "EDITOR"]);

const shareSchema = z.object({
    email: z.string().email(),
    permission: permissionEnum,
});

const updatePermissionSchema = z.object({
    permission: permissionEnum,
});

// Helper to get user's permission on a task
async function getUserPermission(taskId: string, userId: string): Promise<"OWNER" | "EDITOR" | "VIEWER" | null> {
    const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
    if (task) return "OWNER";

    const share = await prisma.taskShare.findFirst({ where: { taskId, userId } });
    if (share) return share.permission;

    return null;
}

// Check if a user exists by email (for sharing)
shareRouter.post(
    "/check-user",
    requireAuth,
    asyncHandler(async (req: AuthRequest, res) => {
        const { email } = req.body;
        if (!email || typeof email !== "string") {
            throw new HttpError(400, "Email is required");
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true }
        });

        if (!user) {
            return res.json({ exists: false, user: null });
        }

        return res.json({ exists: true, user });
    })
);

// Share a task with another user
shareRouter.post(
    "/tasks/:taskId/share",
    requireAuth,
    asyncHandler(async (req: AuthRequest, res) => {
        if (!req.userId) throw new HttpError(401, "Unauthorized");

        const { taskId } = req.params;
        const parsed = shareSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
        }

        const { email, permission } = parsed.data;

        const sharerPermission = await getUserPermission(taskId, req.userId);
        if (!sharerPermission) {
            throw new HttpError(404, "Task not found or no access");
        }

        if (sharerPermission === "VIEWER" && permission === "EDITOR") {
            throw new HttpError(403, "Viewers can only share as Viewer");
        }

        const targetUser = await prisma.user.findUnique({ where: { email } });
        if (!targetUser) {
            throw new HttpError(404, "User not found. They need to sign up first.");
        }

        if (targetUser.id === req.userId) {
            throw new HttpError(400, "Cannot share with yourself");
        }

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { user: { select: { id: true, name: true } } }
        });
        if (!task) {
            throw new HttpError(404, "Task not found");
        }
        if (task.userId === targetUser.id) {
            throw new HttpError(400, "Cannot share with the task owner");
        }

        const existingShare = await prisma.taskShare.findFirst({
            where: { taskId, userId: targetUser.id }
        });

        const actor = await prisma.user.findUnique({ where: { id: req.userId } });

        if (existingShare) {
            if (existingShare.permission !== permission) {
                if (sharerPermission === "VIEWER" && permission === "EDITOR") {
                    throw new HttpError(403, "Cannot upgrade permission as a Viewer");
                }

                const updated = await prisma.taskShare.update({
                    where: { id: existingShare.id },
                    data: { permission },
                    include: { user: { select: { id: true, name: true, email: true } } }
                });

                // Notify owner about permission change
                if (sharerPermission !== "OWNER" && actor) {
                    await createNotification({
                        userId: task.userId,
                        type: "PERMISSION_CHANGED",
                        taskId: task.id,
                        taskTitle: task.title,
                        actorId: req.userId,
                        actorName: actor.name,
                        message: `${actor.name} changed ${targetUser.name}'s permission to ${permission} on "${task.title}"`,
                    });
                }

                return res.json({ share: updated, message: "Permission updated" });
            }
            return res.json({ share: existingShare, message: "Already shared" });
        }

        const share = await prisma.taskShare.create({
            data: {
                taskId,
                userId: targetUser.id,
                permission,
                sharedBy: req.userId,
            },
            include: { user: { select: { id: true, name: true, email: true } } }
        });

        // Get all existing collaborators to notify
        const existingShares = await prisma.taskShare.findMany({
            where: { taskId, userId: { not: targetUser.id } }
        });

        // Notify all existing collaborators (owner + shared users) about the new addition
        const usersToNotify: string[] = [];

        // Add owner (if not the one sharing)
        if (task.userId !== req.userId) {
            usersToNotify.push(task.userId);
        }

        // Add all existing collaborators (except the sharer and new person)
        for (const s of existingShares) {
            if (s.userId !== req.userId) {
                usersToNotify.push(s.userId);
            }
        }

        // Send notifications to all existing collaborators
        for (const userId of usersToNotify) {
            await createNotification({
                userId,
                type: "COLLABORATOR_ADDED",
                taskId: task.id,
                taskTitle: task.title,
                actorId: req.userId,
                actorName: actor?.name || "Someone",
                message: `${actor?.name || "Someone"} added ${targetUser.name} to "${task.title}"`,
            });
        }

        // Also notify the target user that they were added
        await createNotification({
            userId: targetUser.id,
            type: "TASK_SHARED",
            taskId: task.id,
            taskTitle: task.title,
            actorId: req.userId,
            actorName: actor?.name || "Someone",
            message: `${actor?.name || "Someone"} shared "${task.title}" with you`,
        });

        res.status(201).json({ share });
    })
);

// Get collaborators for a task
shareRouter.get(
    "/tasks/:taskId/collaborators",
    requireAuth,
    asyncHandler(async (req: AuthRequest, res) => {
        if (!req.userId) throw new HttpError(401, "Unauthorized");

        const { taskId } = req.params;

        const permission = await getUserPermission(taskId, req.userId);
        if (!permission) {
            throw new HttpError(404, "Task not found or no access");
        }

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                sharedWith: {
                    include: { user: { select: { id: true, name: true, email: true } } }
                }
            }
        });

        if (!task) {
            throw new HttpError(404, "Task not found");
        }

        const collaborators = [
            { ...task.user, permission: "OWNER" as const },
            ...task.sharedWith.map(s => ({ ...s.user, permission: s.permission, shareId: s.id }))
        ];

        res.json({ collaborators, myPermission: permission });
    })
);

// Update a collaborator's permission
shareRouter.patch(
    "/tasks/:taskId/share/:userId",
    requireAuth,
    asyncHandler(async (req: AuthRequest, res) => {
        if (!req.userId) throw new HttpError(401, "Unauthorized");

        const { taskId, userId } = req.params;
        const parsed = updatePermissionSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
        }

        const { permission: newPermission } = parsed.data;

        const requesterPermission = await getUserPermission(taskId, req.userId);
        if (!requesterPermission) {
            throw new HttpError(404, "Task not found or no access");
        }

        if (requesterPermission !== "OWNER") {
            throw new HttpError(403, "Only the owner can change permissions");
        }

        const share = await prisma.taskShare.findFirst({ where: { taskId, userId } });
        if (!share) {
            throw new HttpError(404, "Collaborator not found");
        }

        const updated = await prisma.taskShare.update({
            where: { id: share.id },
            data: { permission: newPermission },
            include: { user: { select: { id: true, name: true, email: true } } }
        });

        res.json({ share: updated });
    })
);

// Remove a collaborator
shareRouter.delete(
    "/tasks/:taskId/share/:userId",
    requireAuth,
    asyncHandler(async (req: AuthRequest, res) => {
        if (!req.userId) throw new HttpError(401, "Unauthorized");

        const { taskId, userId } = req.params;

        const requesterPermission = await getUserPermission(taskId, req.userId);
        if (!requesterPermission) {
            throw new HttpError(404, "Task not found or no access");
        }

        if (requesterPermission !== "OWNER" && userId !== req.userId) {
            throw new HttpError(403, "Only the owner can remove other collaborators");
        }

        const share = await prisma.taskShare.findFirst({ where: { taskId, userId } });
        if (!share) {
            throw new HttpError(404, "Collaborator not found");
        }

        await prisma.taskShare.delete({ where: { id: share.id } });

        res.status(204).send();
    })
);
