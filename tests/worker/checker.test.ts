import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { checkUrl } from "../../apps/worker/src/checker.ts";

function startServer(handler: (delay: () => void) => void) {
  const server = createServer((_request, response) => {
    handler(() => {
      response.writeHead(200);
      response.end("ok");
    });
  });
  return new Promise<{ url: string; close: () => Promise<void> }>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string")
        throw new Error("Test server did not start");
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

test("checkUrl reports a successful expected response", async () => {
  const server = await startServer((finish) => finish());
  try {
    const result = await checkUrl(server.url);
    assert.equal(result.ok, true);
    assert.equal(result.statusCode, 200);
    assert.equal(result.errorMessage, null);
  } finally {
    await server.close();
  }
});

test("checkUrl reports an unexpected response status", async () => {
  const server = createServer((_request, response) => {
    response.writeHead(503);
    response.end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");

  try {
    const result = await checkUrl(`http://127.0.0.1:${address.port}`);
    assert.equal(result.ok, false);
    assert.equal(result.statusCode, 503);
    assert.equal(result.errorMessage, "Expected 200, received 503");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("checkUrl aborts requests that exceed the timeout", async () => {
  const server = await startServer((finish) => setTimeout(finish, 100));
  try {
    const result = await checkUrl(server.url, 200, 20);
    assert.equal(result.ok, false);
    assert.equal(result.statusCode, null);
    assert.notEqual(result.errorMessage, null);
  } finally {
    await server.close();
  }
});
