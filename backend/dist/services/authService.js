"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRefreshCookieName = void 0;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.refreshTokens = refreshTokens;
exports.issueAuth = issueAuth;
exports.setRefreshCookie = setRefreshCookie;
exports.clearRefreshCookie = clearRefreshCookie;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
const REFRESH_COOKIE_NAME = "refresh_token";
async function registerUser(params) {
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: params.email } });
    if (existing) {
        throw new errors_1.HttpError(409, "Email already registered");
    }
    const hashedPassword = await bcrypt_1.default.hash(params.password, 10);
    const user = await prisma_1.prisma.user.create({
        data: { name: params.name, email: params.email, hashedPassword },
    });
    return issueAuth(user.id);
}
async function loginUser(params) {
    const user = await prisma_1.prisma.user.findUnique({ where: { email: params.email } });
    if (!user) {
        throw new errors_1.HttpError(401, "Invalid credentials");
    }
    const valid = await bcrypt_1.default.compare(params.password, user.hashedPassword);
    if (!valid) {
        throw new errors_1.HttpError(401, "Invalid credentials");
    }
    return issueAuth(user.id);
}
function refreshTokens(refreshToken) {
    if (!refreshToken) {
        throw new errors_1.HttpError(401, "Missing refresh token");
    }
    try {
        const payload = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
        return issueAuth(payload.sub);
    }
    catch (err) {
        throw new errors_1.HttpError(401, "Invalid refresh token");
    }
}
function issueAuth(userId) {
    const accessToken = jsonwebtoken_1.default.sign({ sub: userId }, env_1.env.JWT_ACCESS_SECRET, {
        expiresIn: `${env_1.env.ACCESS_TOKEN_TTL_MINUTES}m`,
    });
    const refreshToken = jsonwebtoken_1.default.sign({ sub: userId }, env_1.env.JWT_REFRESH_SECRET, {
        expiresIn: `${env_1.env.REFRESH_TOKEN_TTL_DAYS}d`,
    });
    return { accessToken, refreshToken };
}
function setRefreshCookie(res, token) {
    res.cookie(REFRESH_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: env_1.env.REFRESH_COOKIE_SECURE,
        domain: env_1.env.REFRESH_COOKIE_DOMAIN,
        maxAge: env_1.env.refreshTtlMs,
        path: "/",
    });
}
function clearRefreshCookie(res) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        sameSite: "lax",
        secure: env_1.env.REFRESH_COOKIE_SECURE,
        domain: env_1.env.REFRESH_COOKIE_DOMAIN,
        path: "/",
    });
}
const getRefreshCookieName = () => REFRESH_COOKIE_NAME;
exports.getRefreshCookieName = getRefreshCookieName;
//# sourceMappingURL=authService.js.map