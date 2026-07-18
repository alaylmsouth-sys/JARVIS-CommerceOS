import type { NextRequest } from "next/server";

import { createProxyResponse } from "../proxy-response";

const backend = process.env.BACKEND_INTERNAL_URL ?? "http://backend:8000";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const incoming = new URL(request.url);
  const target = new URL(`/${path.join("/")}`, backend);
  target.search = incoming.search;

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (authorization) {
    headers.set("authorization", authorization);
  }
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.text();
  }

  const response = await fetch(target, init);
  return createProxyResponse(response);
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
