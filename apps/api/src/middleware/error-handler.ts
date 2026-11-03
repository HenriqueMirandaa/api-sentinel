import { NextFunction, Request, Response } from "express";
import { z } from "zod";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  console.error(error);
  if (error instanceof z.ZodError) {
    return response.status(400).json({
      error: "Invalid request",
      details: error.flatten(),
    });
  }
  if ((error as { code?: string })?.code === "23505") {
    return response.status(409).json({ error: "Resource already exists" });
  }
  response.status(500).json({ error: "Internal server error" });
}
