import { NextRequest, NextResponse } from "next/server";
import { apiError, rateLimit } from "@/lib/security";
import { fetchSpotifyMetadata, validateSpotifyUrl } from "@/lib/spotify";

// This endpoint makes one fixed-origin metadata request; it never initializes playback.
export async function GET(request: NextRequest) {
  try {
    rateLimit(
      `spotify-metadata:${request.headers.get("x-forwarded-for")?.split(",")[0] || "local"}`,
      20,
    );
  } catch (error) {
    return apiError(error);
  }
  const input = request.nextUrl.searchParams.get("url");
  if (!input || input.length > 500)
    return NextResponse.json(
      { error: "Enter a Spotify podcast link." },
      { status: 400 },
    );
  const link = validateSpotifyUrl(input);
  if (!link)
    return NextResponse.json(
      { error: "Use an https://open.spotify.com/show/… or /episode/… link." },
      { status: 400 },
    );
  try {
    return NextResponse.json(await fetchSpotifyMetadata(link), {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Spotify is unavailable. Try again later.",
      },
      { status: 502 },
    );
  }
}
