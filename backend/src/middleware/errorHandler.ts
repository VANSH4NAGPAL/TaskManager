import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/errors";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details ?? undefined });
  }

  console.error("Unhandled error", err);
  return res.status(500).json({ message: "Internal server error" });
}
