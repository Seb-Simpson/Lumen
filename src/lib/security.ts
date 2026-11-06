import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const limits = new Map<string, { count: number; expires: number }>();
/** In-process limiter for local/single-instance use. Replace with shared Redis before multi-instance hosting. */
export function rateLimit(key: string, max = 60, windowMs = 60000) {
  const now = Date.now();
  if (limits.size > 5000)
    for (const [k, v] of limits) if (v.expires < now) limits.delete(k);
  const state = limits.get(key);
  if (!state || state.expires < now) {
    limits.set(key, { count: 1, expires: now + windowMs });
    return;
  }
  if (++state.count > max)
    throw new HttpError(429, "Too many requests. Please try again shortly.");
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const configured = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  if (!origin || origin !== new URL(configured).origin)
    throw new HttpError(
      403,
      "This request could not be verified. Refresh the page and try again.",
    );
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site")
    throw new HttpError(403, "Cross-site requests are not allowed.");
}
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Expected a JSON request.");
  if (Number(request.headers.get("content-length") || 0) > 65536)
    throw new HttpError(413, "This request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "A request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 65536) {
      await reader.cancel();
      throw new HttpError(413, "This request is too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "The request is not valid JSON.");
  }
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: error.issues[0]?.message || "Check the information you entered.",
      },
      { status: 400 },
    );
  // Never send SQL, provider responses, credentials, or stack traces to clients.
  console.error(
    "[Lumen] API request failed:",
    error instanceof Error ? error.name : "UnknownError",
  );
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
