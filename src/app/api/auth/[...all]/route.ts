import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { apiError, assertSameOrigin, readJson } from "@/lib/security";
export async function GET(request: Request) {
  try {
    return toNextJsHandler(await getAuth()).GET(request);
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    // Auth is JSON-only in this deployment. Bound payloads before the provider reads them.
    const body = await readJson(request);
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const fields = body as Record<string, unknown>;
      if ("name" in fields)
        fields.name = z
          .string()
          .trim()
          .min(1, "Enter your name.")
          .max(80, "Your name must be 80 characters or fewer.")
          .parse(fields.name);
      for (const key of ["email", "newEmail"])
        if (key in fields)
          z.string()
            .max(254, "Email addresses must be 254 characters or fewer.")
            .email("Enter a valid email address.")
            .parse(fields[key]);
    }
    const headers = new Headers(request.headers);
    headers.delete("content-length");
    const bounded = new Request(request.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: request.signal,
    });
    return toNextJsHandler(await getAuth()).POST(bounded);
  } catch (error) {
    return apiError(error);
  }
}
