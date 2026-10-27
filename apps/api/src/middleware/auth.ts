import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const token = request.headers.authorization?.replace("Bearer ", "");
  if (!token) return response.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { userId: string };
    request.userId = payload.userId;
    next();
  } catch {
    return response.status(401).json({ error: "Invalid token" });
  }
}

declare global {
  namespace Express {
    interface Request { userId?: string }
  }
}
