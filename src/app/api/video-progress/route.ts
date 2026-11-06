import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getPublishedVideo, getSession } from "@/lib/services";
import { watchHistory } from "@/lib/schema";
import {
  apiError,
  assertSameOrigin,
  HttpError,
  rateLimit,
  readJson,
} from "@/lib/security";
const input = z.object({
  videoId: z.string().min(1).max(100),
  positionSeconds: z.number().int().min(0).max(604800),
});
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const current = await getSession();
    if (!current) throw new HttpError(401, "Sign in to keep your place.");
    rateLimit(`video-progress:${current.user.id}`, 12);
    const data = input.parse(await readJson(request));
    const video = await getPublishedVideo(data.videoId);
    if (!video) throw new HttpError(404, "This video is unavailable.");
    const positionSeconds = video.durationSeconds
      ? Math.min(data.positionSeconds, video.durationSeconds)
      : data.positionSeconds;
    const db = await getDb();
    await db
      .insert(watchHistory)
      .values({
        id: crypto.randomUUID(),
        userId: current.user.id,
        videoId: data.videoId,
        positionSeconds,
      })
      .onConflictDoUpdate({
        target: [watchHistory.userId, watchHistory.videoId],
        set: { positionSeconds, updatedAt: new Date() },
      });
    return NextResponse.json(
      { saved: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function GET(request: NextRequest) {
  try {
    const current = await getSession();
    if (!current) throw new HttpError(401, "Sign in to view your progress.");
    const videoId = z
      .string()
      .min(1)
      .max(100)
      .parse(request.nextUrl.searchParams.get("videoId"));
    const db = await getDb();
    const [progress] = await db
      .select({ positionSeconds: watchHistory.positionSeconds })
      .from(watchHistory)
      .where(
        and(
          eq(watchHistory.userId, current.user.id),
          eq(watchHistory.videoId, videoId),
        ),
      )
      .limit(1);
    return NextResponse.json(
      { positionSeconds: progress?.positionSeconds || 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
