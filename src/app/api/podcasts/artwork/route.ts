import { NextRequest, NextResponse } from "next/server";
import { apiError, HttpError, rateLimit } from "@/lib/security";
const allowedHosts = [
  "i.scdn.co",
  "image-cdn-ak.spotifycdn.com",
  "image-cdn-fa.spotifycdn.com",
];
/** Serve Spotify artwork without exposing visitors' addresses to an image CDN. */
export async function GET(request: NextRequest) {
  try {
    rateLimit(
      `podcast-artwork:${request.headers.get("x-forwarded-for")?.split(",")[0] || "local"}`,
      90,
    );
    const input = request.nextUrl.searchParams.get("url");
    if (!input || input.length > 1000)
      throw new HttpError(400, "Artwork is unavailable.");
    let url: URL;
    try {
      url = new URL(input);
    } catch {
      throw new HttpError(400, "Artwork is unavailable.");
    }
    if (
      url.protocol !== "https:" ||
      url.port ||
      url.username ||
      url.password ||
      !allowedHosts.includes(url.hostname) ||
      !/^\/image\/[A-Za-z0-9]+$/.test(url.pathname) ||
      url.search ||
      url.hash
    )
      throw new HttpError(400, "Artwork is unavailable.");
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(7000),
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg" },
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
    if (!response.ok)
      throw new HttpError(502, "Artwork is temporarily unavailable.");
    const contentType = response.headers.get("content-type")?.split(";")[0];
    if (
      !contentType ||
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
        contentType,
      )
    )
      throw new HttpError(502, "Artwork is unavailable.");
    if (Number(response.headers.get("content-length") || 0) > 3_000_000)
      throw new HttpError(502, "Artwork is unavailable.");
    const reader = response.body?.getReader();
    if (!reader) throw new HttpError(502, "Artwork is unavailable.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 3_000_000) {
        await reader.cancel();
        throw new HttpError(502, "Artwork is unavailable.");
      }
      chunks.push(value);
    }
    return new NextResponse(Buffer.concat(chunks), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
