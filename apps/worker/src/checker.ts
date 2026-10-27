export type CheckResult = {
  ok: boolean;
  statusCode: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
};

export async function checkUrl(url: string, expectedStatus = 200, timeoutMs = 10000): Promise<CheckResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return {
      ok: response.status === expectedStatus,
      statusCode: response.status,
      responseTimeMs: Date.now() - started,
      errorMessage: response.status === expectedStatus ? null : `Expected ${expectedStatus}, received ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: null,
      responseTimeMs: Date.now() - started,
      errorMessage: error instanceof Error ? error.message : "Request failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}
