import { Request, Response, NextFunction } from "express";

export class Logger {
  static info(message: string, meta?: any) {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, meta ? JSON.stringify(meta) : "");
  }

  static warn(message: string, meta?: any) {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, meta ? JSON.stringify(meta) : "");
  }

  static error(message: string, error?: any) {
    console.error(
      `[ERROR] [${new Date().toISOString()}] ${message}`,
      error instanceof Error ? { message: error.message, stack: error.stack } : error || ""
    );
  }

  static authFailure(username: string, ip: string, reason: string) {
    console.warn(`[AUTH FAILURE] [${new Date().toISOString()}] User: ${username} | IP: ${ip} | Reason: ${reason}`);
  }

  static apiFailure(path: string, status: number, errorMsg: string) {
    console.error(`[API FAILURE] [${new Date().toISOString()}] Path: ${path} | Status: ${status} | Error: ${errorMsg}`);
  }
}

// Request logger middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logMsg = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    if (res.statusCode >= 400) {
      Logger.apiFailure(req.originalUrl, res.statusCode, logMsg);
    } else {
      Logger.info(logMsg);
    }
  });
  next();
}
