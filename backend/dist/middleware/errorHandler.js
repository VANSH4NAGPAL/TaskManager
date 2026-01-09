"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
function errorHandler(err, _req, res, _next) {
    if (err instanceof errors_1.HttpError) {
        return res.status(err.status).json({ message: err.message, details: err.details ?? undefined });
    }
    console.error("Unhandled error", err);
    return res.status(500).json({ message: "Internal server error" });
}
//# sourceMappingURL=errorHandler.js.map