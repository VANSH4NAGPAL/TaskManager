"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const asyncHandler_1 = require("../utils/asyncHandler");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errors_1 = require("../utils/errors");
exports.profileRouter = (0, express_1.Router)();
const updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
});
exports.profileRouter.get("/", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.userId)
        throw new errors_1.HttpError(401, "Unauthorized");
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });
    if (!user)
        throw new errors_1.HttpError(404, "User not found");
    res.json({ user });
}));
exports.profileRouter.patch("/", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.userId)
        throw new errors_1.HttpError(401, "Unauthorized");
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new errors_1.HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
    }
    const updated = await prisma_1.prisma.user.update({
        where: { id: req.userId },
        data: parsed.data,
        select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });
    res.json({ user: updated });
}));
//# sourceMappingURL=profile.js.map