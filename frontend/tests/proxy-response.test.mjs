import assert from "node:assert/strict";
import test from "node:test";

import { createProxyResponse } from "../app/api/backend/proxy-response.ts";

test("returns a null body for 204 responses", async () => {
  const response = await createProxyResponse(new Response(null, { status: 204 }));

  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  assert.equal(response.headers.get("content-type"), null);
});

test("preserves JSON bodies and content type", async () => {
  const response = await createProxyResponse(
    new Response('{"status":"ok"}', {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), '{"status":"ok"}');
  assert.equal(response.headers.get("content-type"), "application/json");
});
