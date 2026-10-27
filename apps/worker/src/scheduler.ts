import { Pool } from "pg";
import { checkUrl } from "./checker";
import { processCheckResult } from "./incident-service";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function runDueChecks() {
  const monitors = await pool.query(
    `UPDATE monitors SET next_check_at = now() + make_interval(secs => interval_seconds)
     WHERE next_check_at <= now()
     RETURNING id, user_id, name, url, expected_status, timeout_ms, consecutive_failures`,
  );
  for (const monitor of monitors.rows) {
    const result = await checkUrl(monitor.url, monitor.expected_status, monitor.timeout_ms);
    await pool.query(
      `INSERT INTO checks (monitor_id, ok, status_code, response_time_ms, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [monitor.id, result.ok, result.statusCode, result.responseTimeMs, result.errorMessage],
    );
    const user = await pool.query("SELECT email FROM users WHERE id = $1", [monitor.user_id]);
    await processCheckResult(pool, monitor, result, user.rows[0]?.email);
  }
}
