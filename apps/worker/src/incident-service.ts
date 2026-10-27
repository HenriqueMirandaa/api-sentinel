import type { Pool } from "pg";
import type { CheckResult } from "./checker";
import { mailer } from "./email-service";

export async function processCheckResult(pool: Pool, monitor: { id: string; name: string; url: string; consecutive_failures: number }, result: CheckResult, email?: string) {
  if (result.ok) {
    const open = await pool.query("SELECT id FROM incidents WHERE monitor_id = $1 AND recovered_at IS NULL", [monitor.id]);
    await pool.query("UPDATE monitors SET consecutive_failures = 0 WHERE id = $1", [monitor.id]);
    await pool.query("UPDATE incidents SET recovered_at = now() WHERE monitor_id = $1 AND recovered_at IS NULL", [monitor.id]);
    if (open.rowCount && email && mailer && process.env.SMTP_FROM) {
      await mailer.sendMail({ from: process.env.SMTP_FROM, to: email, subject: `[API Sentinel] Recovered: ${monitor.name}`, text: `${monitor.url} is responding again.` });
    }
    return;
  }

  const failures = monitor.consecutive_failures + 1;
  await pool.query("UPDATE monitors SET consecutive_failures = $2 WHERE id = $1", [monitor.id, failures]);
  if (failures >= 3) {
    const incident = await pool.query(
      "INSERT INTO incidents (monitor_id, failure_message) VALUES ($1, $2) ON CONFLICT (monitor_id) WHERE recovered_at IS NULL DO NOTHING",
      [monitor.id, result.errorMessage],
    );
    if (incident.rowCount && email && mailer && process.env.SMTP_FROM) {
      await mailer.sendMail({ from: process.env.SMTP_FROM, to: email, subject: `[API Sentinel] Incident: ${monitor.name}`, text: `${monitor.url} failed: ${result.errorMessage}` });
    }
  }
}
