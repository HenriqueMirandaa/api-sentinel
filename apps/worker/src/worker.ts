import { closeScheduler, runDueChecks } from "./scheduler";

const configuredInterval = Number(process.env.CHECK_INTERVAL_MS ?? 60000);
const intervalMs =
  Number.isInteger(configuredInterval) && configuredInterval >= 1000
    ? configuredInterval
    : 60000;
const interval = setInterval(() => void tick(), intervalMs);
let tickRunning = false;
let shuttingDown = false;

async function tick() {
  if (tickRunning || shuttingDown) return;
  tickRunning = true;
  try {
    await runDueChecks();
  } catch (error) {
    console.error("Worker tick failed", error);
  } finally {
    tickRunning = false;
  }
}

void tick();

async function shutdown(signal: "SIGINT" | "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(interval);
  console.log(`Worker received ${signal}; shutting down`);
  while (tickRunning) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  await closeScheduler();
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
