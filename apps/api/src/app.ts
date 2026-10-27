import cors from "cors";
import express from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "./config/database";
import { env } from "./config/env";
import { requireAuth } from "./middleware/auth";

export const app = express();

app.use(cors({ origin: env.webOrigin }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

const credentials = z.object({ email: z.string().email(), password: z.string().min(8) });
const monitorInput = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  intervalSeconds: z.number().int().min(60).max(86400).default(300),
  expectedStatus: z.number().int().min(100).max(599).default(200),
  timeoutMs: z.number().int().min(1000).max(30000).default(10000),
});

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, "hex"));
}

app.post("/api/auth/register", async (request, response, next) => {
  try {
    const { email, password } = credentials.parse(request.body);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [email.toLowerCase(), hashPassword(password)],
    );
    const token = jwt.sign({ userId: result.rows[0].id }, env.jwtSecret, { expiresIn: "7d" });
    response.status(201).json({ user: result.rows[0], token });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (request, response, next) => {
  try {
    const { email, password } = credentials.parse(request.body);
    const result = await pool.query("SELECT id, email, password_hash FROM users WHERE email = $1", [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) return response.status(401).json({ error: "Invalid credentials" });
    response.json({ user: { id: user.id, email: user.email }, token: jwt.sign({ userId: user.id }, env.jwtSecret, { expiresIn: "7d" }) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/monitors", requireAuth, async (request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT m.*, COALESCE(c.ok, true) AS last_ok, c.checked_at AS last_checked_at
       FROM monitors m LEFT JOIN LATERAL (SELECT ok, checked_at FROM checks WHERE monitor_id = m.id ORDER BY checked_at DESC LIMIT 1) c ON true
       WHERE m.user_id = $1 ORDER BY m.created_at DESC`,
      [request.userId],
    );
    response.json(result.rows);
  } catch (error) { next(error); }
});

app.post("/api/monitors", requireAuth, async (request, response, next) => {
  try {
    const input = monitorInput.parse(request.body);
    const result = await pool.query(
      `INSERT INTO monitors (user_id, name, url, interval_seconds, expected_status, timeout_ms, next_check_at)
       VALUES ($1, $2, $3, $4, $5, $6, now()) RETURNING *`,
      [request.userId, input.name, input.url, input.intervalSeconds, input.expectedStatus, input.timeoutMs],
    );
    response.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

app.delete("/api/monitors/:id", requireAuth, async (request, response, next) => {
  try {
    const result = await pool.query("DELETE FROM monitors WHERE id = $1 AND user_id = $2 RETURNING id", [request.params.id, request.userId]);
    if (!result.rowCount) return response.status(404).json({ error: "Monitor not found" });
    response.status(204).end();
  } catch (error) { next(error); }
});

app.get("/api/monitors/:id/checks", requireAuth, async (request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT c.* FROM checks c JOIN monitors m ON m.id = c.monitor_id WHERE c.monitor_id = $1 AND m.user_id = $2 ORDER BY c.checked_at DESC LIMIT 100`,
      [request.params.id, request.userId],
    );
    response.json(result.rows);
  } catch (error) { next(error); }
});

app.get("/api/incidents", requireAuth, async (request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT i.*, m.name AS monitor_name FROM incidents i JOIN monitors m ON m.id = i.monitor_id WHERE m.user_id = $1 ORDER BY i.opened_at DESC LIMIT 100`,
      [request.userId],
    );
    response.json(result.rows);
  } catch (error) { next(error); }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  if (error instanceof z.ZodError) return response.status(400).json({ error: "Invalid request", details: error.flatten() });
  if ((error as { code?: string }).code === "23505") return response.status(409).json({ error: "Email already registered" });
  response.status(500).json({ error: "Internal server error" });
});
