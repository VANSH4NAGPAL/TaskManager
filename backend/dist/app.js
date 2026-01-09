"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./routes/auth");
const profile_1 = require("./routes/profile");
const tasks_1 = require("./routes/tasks");
const app = (0, express_1.default)();
exports.app = app;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.rateLimitWindowMs,
    max: env_1.env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
});
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (env_1.env.corsOrigins.includes(origin))
            return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
};
app.use(limiter);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)(env_1.env.NODE_ENV === "production" ? "combined" : "dev"));
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/auth", auth_1.authRouter);
app.use("/me", profile_1.profileRouter);
app.use("/tasks", tasks_1.taskRouter);
app.use(errorHandler_1.errorHandler);
//# sourceMappingURL=app.js.map