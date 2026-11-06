import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { reports } from "@/lib/schema";
import { getSession, getPublishedVideo } from "@/lib/services";
import {
  apiError,
  assertSameOrigin,
  HttpError,
  rateLimit,
  readJson,
} from "@/lib/security";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await getSession();
    if (!session) throw new HttpError(401, "Sign in to report content.");
    rateLimit(`report:${session.user.id}`, 5, 3600000);
    const input = z
      .object({
        resourceType: z.literal("video"),
        resourceId: z.string().min(1).max(100),
        reason: z
          .string()
          .trim()
          .min(10, "Please add a little more detail.")
          .max(2000),
      })
      .strict()
      .parse(await readJson(request));
    if (!(await getPublishedVideo(input.resourceId)))
      throw new HttpError(404, "This video is unavailable.");
    const db = await getDb();
    await db
      .insert(reports)
      .values({ id: randomUUID(), userId: session.user.id, ...input });
    return NextResponse.json({
      ok: true,
      message: "Your report has been recorded for review.",
    });
  } catch (error) {
    return apiError(error);
  }
}
