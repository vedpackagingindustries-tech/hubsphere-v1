import { Response } from "express";

export function sendSuccess(res: Response, data: any, message?: string, status: number = 200) {
  return res.status(status).json({
    success: true,
    data,
    ...(message && { message })
  });
}

export function sendError(res: Response, message: string, status: number = 500, details?: any) {
  return res.status(status).json({
    success: false,
    error: message,
    ...(details && { details })
  });
}
