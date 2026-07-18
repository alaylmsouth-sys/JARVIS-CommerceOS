const bodylessStatuses = new Set([204, 205, 304]);

export async function createProxyResponse(response: Response): Promise<Response> {
  const bodyless = bodylessStatuses.has(response.status);
  const body = bodyless ? null : await response.text();
  const headers = new Headers();
  const contentType = response.headers.get("content-type");

  if (!bodyless && contentType) {
    headers.set("content-type", contentType);
  }

  return new Response(body, {
    status: response.status,
    headers,
  });
}
