import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";

test("GET /health reports that the API process is running", async () => {
  process.env.DATABASE_URL ??= "postgres://localhost/api_sentinel";
  process.env.JWT_SECRET ??= "test-secret";
  const { app } = await import("../../apps/api/src/app.ts");
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: "ok" });
});
