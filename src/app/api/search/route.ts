import { NextResponse } from "next/server";
import { searchContent } from "@/lib/search";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") || "").slice(0, 120);
  try {
    return NextResponse.json(
      {
        query: q,
        results: await searchContent(
          q,
          params.get("type") || "",
          params.get("subject") || "",
          params.get("level") || "",
          params.get("sort") || "relevance",
        ),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Search is unavailable. Please try again." },
      { status: 503 },
    );
  }
}
