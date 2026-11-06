import { NextResponse } from "next/server";
import { and, desc, eq, notInArray } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { searchHistory, userPreferences } from "@/lib/schema";
import { getSession } from "@/lib/services";
import {
  apiError,
  assertSameOrigin,
  rateLimit,
  readJson,
} from "@/lib/security";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const current = await getSession();
    if (!current) return NextResponse.json({ history: [] });
    const db = await getDb();
    const [settings] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, current.user.id));
    if (settings?.preferences.searchHistory !== true)
      return NextResponse.json(
        { history: [] },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    const history = await db
      .select({
        id: searchHistory.id,
        query: searchHistory.query,
        searchedAt: searchHistory.searchedAt,
      })
      .from(searchHistory)
      .where(eq(searchHistory.userId, current.user.id))
      .orderBy(desc(searchHistory.searchedAt))
      .limit(20);
    return NextResponse.json(
      { history },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = z
      .object({ query: z.string().trim().min(1).max(120) })
      .strict()
      .parse(await readJson(request));
    const current = await getSession();
    if (!current) return NextResponse.json({ ok: true, recorded: false });
    rateLimit(`search-history:${current.user.id}`, 60);
    const db = await getDb();
    const [settings] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, current.user.id));
    if (settings?.preferences.searchHistory !== true)
      return NextResponse.json({ ok: true, recorded: false });
    await db
      .insert(searchHistory)
      .values({ id: randomUUID(), userId: current.user.id, query: input.query })
      .onConflictDoUpdate({
        target: [searchHistory.userId, searchHistory.query],
        set: { searchedAt: new Date() },
      });
    const retained = await db
      .select({ id: searchHistory.id })
      .from(searchHistory)
      .where(eq(searchHistory.userId, current.user.id))
      .orderBy(desc(searchHistory.searchedAt))
      .limit(20);
    await db.delete(searchHistory).where(
      and(
        eq(searchHistory.userId, current.user.id),
        notInArray(
          searchHistory.id,
          retained.map((item) => item.id),
        ),
      ),
    );
    return NextResponse.json({ ok: true, recorded: true });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const current = await getSession();
    if (current) {
      rateLimit(`search-history:${current.user.id}`, 60);
      await (
        await getDb()
      )
        .delete(searchHistory)
        .where(eq(searchHistory.userId, current.user.id));
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
