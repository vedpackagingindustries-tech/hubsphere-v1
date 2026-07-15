import { Request, Response, NextFunction } from "express";
import { Logger } from "./logger";

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  Logger.error(`Unhandled error occurred at path: ${req.originalUrl}`, err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected error occurred on the server.";

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack, details: err })
  });
}
