"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
function requireAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return next(new errors_1.HttpError(401, "Missing authorization"));
    }
    const token = header.substring("Bearer ".length);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
        req.userId = payload.sub;
        return next();
    }
    catch (err) {
        return next(new errors_1.HttpError(401, "Invalid or expired token"));
    }
}
//# sourceMappingURL=auth.js.map