import { runDueChecks } from "./scheduler";

const intervalMs = Number(process.env.CHECK_INTERVAL_MS ?? 60000);

async function tick() {
  try {
    await runDueChecks();
  } catch (error) {
    console.error("Worker tick failed", error);
  }
}

void tick();
setInterval(() => void tick(), intervalMs);
