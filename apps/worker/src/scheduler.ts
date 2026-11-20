import { Pool } from "pg";
import { checkUrl } from "./checker";
import { processCheckResult } from "./incident-service";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function runDueChecks() {
  const batchSize = boundedNumber(process.env.WORKER_BATCH_SIZE, 100, 1, 500);
  const monitors = await pool.query(
    `WITH due AS (
       SELECT id
       FROM monitors
       WHERE next_check_at <= now()
       ORDER BY next_check_at
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     UPDATE monitors m SET next_check_at = now() + make_interval(secs => m.interval_seconds)
     FROM due
     WHERE m.id = due.id
     RETURNING id, user_id, name, url, expected_status, timeout_ms, consecutive_failures`,
    [batchSize],
  );

  const concurrency = boundedNumber(process.env.WORKER_CONCURRENCY, 5, 1, 20);
  for (let index = 0; index < monitors.rows.length; index += concurrency) {
    await Promise.all(
      monitors.rows.slice(index, index + concurrency).map(async (monitor) => {
        try {
          await processMonitor(monitor);
        } catch (error) {
          console.error(`Worker check failed for monitor ${monitor.id}`, error);
        }
      }),
    );
  }
}

async function processMonitor(monitor: {
  id: string;
  user_id: string;
  name: string;
  url: string;
  expected_status: number;
  timeout_ms: number;
  consecutive_failures: number;
}) {
  const result = await checkUrl(
    monitor.url,
    monitor.expected_status,
    monitor.timeout_ms,
  );
  await pool.query(
    `INSERT INTO checks (monitor_id, ok, status_code, response_time_ms, error_message)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      monitor.id,
      result.ok,
      result.statusCode,
      result.responseTimeMs,
      result.errorMessage,
    ],
  );
  const user = await pool.query("SELECT email FROM users WHERE id = $1", [
    monitor.user_id,
  ]);
  await processCheckResult(pool, monitor, result, user.rows[0]?.email);
}

function boundedNumber(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback;
}

export async function closeScheduler() {
  await pool.end();
}
