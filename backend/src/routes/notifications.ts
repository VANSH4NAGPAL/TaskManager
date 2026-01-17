import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { HttpError } from "../utils/errors";

export const notificationRouter = Router();

// Get user's notifications
notificationRouter.get(
    "/",
    requireAuth,
    asyncHandler(async (req: AuthRequest, res) => {
        if (!req.userId) throw new HttpError(401, "Unauthorized");

        const notifications = await prisma.notification.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: req.userId, read: false },
        });

        res.json({ notifications, unreadCount });
    })
);

// Get unread count only
notificationRouter.get(
    "/unread-count",
    requireAuth,
    asyncHandler(async (req: AuthRequest, res) => {
        if (!req.userId) throw new HttpError(401, "Unauthorized");

        const count = await prisma.notification.count({
            where: { userId: req.userId, read: false },
        });

        res.json({ count });
    })
);

// Mark single notification as read
notificationRouter.post(
    "/:id/read",
    requireAuth,
    asyncHandler(async (req: AuthRequest, res) => {
        if (!req.userId) throw new HttpError(401, "Unauthorized");

        const notification = await prisma.notification.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });

        if (!notification) {
            throw new HttpError(404, "Notification not found");
        }

        await prisma.notification.update({
            where: { id: req.params.id },
            data: { read: true },
        });

        res.json({ success: true });
    })
);

// Mark all as read
notificationRouter.post(
    "/read-all",
    requireAuth,
    asyncHandler(async (req: AuthRequest, res) => {
        if (!req.userId) throw new HttpError(401, "Unauthorized");

        await prisma.notification.updateMany({
            where: { userId: req.userId, read: false },
            data: { read: true },
        });

        res.json({ success: true });
    })
);

// Delete single notification
notificationRouter.delete(
    "/:id",
    requireAuth,
    asyncHandler(async (req: AuthRequest, res) => {
        if (!req.userId) throw new HttpError(401, "Unauthorized");

        const notification = await prisma.notification.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });

        if (!notification) {
            throw new HttpError(404, "Notification not found");
        }

        await prisma.notification.delete({
            where: { id: req.params.id },
        });

        res.status(204).send();
    })
);

// Clear all notifications
notificationRouter.delete(
    "/clear/all",
    requireAuth,
    asyncHandler(async (req: AuthRequest, res) => {
        if (!req.userId) throw new HttpError(401, "Unauthorized");

        await prisma.notification.deleteMany({
            where: { userId: req.userId },
        });

        res.status(204).send();
    })
);

// Helper function to create notification (exported for use in other routes)
export async function createNotification(params: {
    userId: string;
    type: string;
    taskId: string;
    taskTitle: string;
    actorId: string;
    actorName: string;
    message: string;
}) {
    // Don't notify yourself
    if (params.userId === params.actorId) return null;

    return prisma.notification.create({
        data: params,
    });
}
