"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const asyncHandler_1 = require("../utils/asyncHandler");
const authService_1 = require("../services/authService");
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
exports.authRouter = (0, express_1.Router)();
const signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
exports.authRouter.post("/signup", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new errors_1.HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
    }
    const tokens = await (0, authService_1.registerUser)(parsed.data);
    (0, authService_1.setRefreshCookie)(res, tokens.refreshToken);
    const user = await prisma_1.prisma.user.findUniqueOrThrow({ where: { email: parsed.data.email }, select: { id: true, name: true, email: true } });
    res.status(201).json({ user, accessToken: tokens.accessToken });
}));
exports.authRouter.post("/login", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new errors_1.HttpError(400, "Invalid payload", parsed.error.flatten().fieldErrors);
    }
    const tokens = await (0, authService_1.loginUser)(parsed.data);
    (0, authService_1.setRefreshCookie)(res, tokens.refreshToken);
    const user = await prisma_1.prisma.user.findUniqueOrThrow({ where: { email: parsed.data.email }, select: { id: true, name: true, email: true } });
    res.json({ user, accessToken: tokens.accessToken });
}));
exports.authRouter.post("/refresh", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies[(0, authService_1.getRefreshCookieName)()];
    const tokens = (0, authService_1.refreshTokens)(refreshToken);
    (0, authService_1.setRefreshCookie)(res, tokens.refreshToken);
    res.json({ accessToken: tokens.accessToken });
}));
exports.authRouter.post("/logout", (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    (0, authService_1.clearRefreshCookie)(res);
    res.status(204).send();
}));
//# sourceMappingURL=auth.js.map