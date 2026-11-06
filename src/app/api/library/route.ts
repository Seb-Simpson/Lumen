import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import * as tables from "@/lib/schema";
import { getLibrary, getSession } from "@/lib/services";
import {
  apiError,
  assertSameOrigin,
  HttpError,
  rateLimit,
  readJson,
} from "@/lib/security";
import { validateSpotifyUrl, fetchSpotifyMetadata } from "@/lib/spotify";
import { getPath, subjects } from "@/lib/catalog";

export const dynamic = "force-dynamic";
const short = z
  .string()
  .trim()
  .min(1, "Please enter a title.")
  .max(160, "Use 160 characters or fewer.");
const mutation = z
  .object({
    entity: z.enum([
      "collection",
      "goal",
      "note",
      "podcast",
      "interests",
      "preferences",
      "progress",
    ]),
    id: z.string().uuid().optional(),
    name: short.optional(),
    description: z.string().trim().max(2000).optional(),
    title: short.optional(),
    body: z.string().max(20000).optional(),
    completed: z.boolean().optional(),
    url: z.string().max(2048).optional(),
    collectionId: z.string().uuid().nullable().optional(),
    values: z.unknown().optional(),
    pathId: z.string().max(100).optional(),
    stepIndex: z.number().int().min(0).max(100).optional(),
  })
  .strict();
const preferences = z
  .object({
    theme: z.enum(["dark", "light", "system"]).optional(),
    focusMode: z.boolean().optional(),
    level: z
      .enum([
        "All levels",
        "Beginner",
        "Intermediate",
        "Advanced",
        "all",
        "beginner",
        "intermediate",
        "advanced",
      ])
      .optional(),
    reducedMotion: z.boolean().optional(),
    reduceMotion: z.boolean().optional(),
    searchHistory: z.boolean().optional(),
    notifications: z.boolean().optional(),
    personalisation: z.boolean().optional(),
    privateProfile: z.boolean().optional(),
  })
  .strict();
export async function GET() {
  try {
    const session = await getSession();
    if (!session) throw new HttpError(401, "Sign in to open Your Space.");
    return NextResponse.json(await getLibrary(session.user.id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
async function mutate(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await getSession();
    if (!session) throw new HttpError(401, "Sign in to save your learning.");
    const userId = session.user.id;
    rateLimit(`library:${userId}`, 90);
    const input = mutation.parse(await readJson(request));
    const db = await getDb();
    const now = new Date();
    const id = input.id || randomUUID();
    if (input.entity === "interests") {
      if (request.method === "DELETE")
        throw new HttpError(
          405,
          "Use the interest selector to update your interests.",
        );
      const values = z.array(z.string()).max(20).parse(input.values);
      if (
        values.some(
          (value) => !subjects.some((subject) => subject.slug === value),
        )
      )
        throw new HttpError(400, "Choose an existing subject.");
      await db
        .insert(tables.userPreferences)
        .values({ userId, interests: [...new Set(values)] })
        .onConflictDoUpdate({
          target: tables.userPreferences.userId,
          set: { interests: [...new Set(values)], updatedAt: now },
        });
    } else if (input.entity === "preferences") {
      if (request.method === "DELETE")
        throw new HttpError(
          405,
          "Use the preferences form to update settings.",
        );
      const values = preferences.parse(input.values);
      const [existing] = await db
        .select()
        .from(tables.userPreferences)
        .where(eq(tables.userPreferences.userId, userId));
      const merged = { ...(existing?.preferences || {}), ...values };
      if (values.searchHistory === false)
        await db
          .delete(tables.searchHistory)
          .where(eq(tables.searchHistory.userId, userId));
      await db
        .insert(tables.userPreferences)
        .values({ userId, preferences: merged })
        .onConflictDoUpdate({
          target: tables.userPreferences.userId,
          set: { preferences: merged, updatedAt: now },
        });
    } else if (input.entity === "progress") {
      const path = getPath(input.pathId || "");
      if (
        !path ||
        input.stepIndex === undefined ||
        !path.steps[input.stepIndex]
      )
        throw new HttpError(400, "Choose an existing learning path step.");
      await db
        .insert(tables.learningProgress)
        .values({
          id: randomUUID(),
          userId,
          pathId: path.slug,
          stepId: String(input.stepIndex),
          completed: input.completed ?? false,
        })
        .onConflictDoUpdate({
          target: [
            tables.learningProgress.userId,
            tables.learningProgress.pathId,
            tables.learningProgress.stepId,
          ],
          set: { completed: input.completed ?? false, updatedAt: now },
        });
    } else {
      const table =
        input.entity === "collection"
          ? tables.collections
          : input.entity === "goal"
            ? tables.goals
            : input.entity === "note"
              ? tables.notes
              : tables.savedPodcasts;
      if (request.method !== "POST") {
        if (!input.id) throw new HttpError(400, "Choose an item to update.");
        const [owned] = await db
          .select({ id: table.id })
          .from(table)
          .where(and(eq(table.id, input.id), eq(table.userId, userId)))
          .limit(1);
        if (!owned) throw new HttpError(404, "This item is unavailable.");
      }
      if (request.method === "DELETE")
        await db
          .delete(table)
          .where(and(eq(table.id, id), eq(table.userId, userId)));
      else if (input.entity === "collection") {
        if (request.method === "POST")
          await db
            .insert(tables.collections)
            .values({
              id,
              userId,
              name: short.parse(input.name),
              description: input.description || "",
            });
        else {
          if (!input.name && input.description === undefined)
            throw new HttpError(400, "Enter a collection name or description.");
          await db
            .update(tables.collections)
            .set({
              ...(input.name ? { name: input.name } : {}),
              ...(input.description !== undefined
                ? { description: input.description }
                : {}),
              updatedAt: now,
            })
            .where(and(eq(table.id, id), eq(table.userId, userId)));
        }
      } else if (input.entity === "goal") {
        if (request.method === "POST")
          await db
            .insert(tables.goals)
            .values({
              id,
              userId,
              title: short.parse(input.title),
              completed: false,
            });
        else
          await db
            .update(tables.goals)
            .set({
              ...(input.title ? { title: input.title } : {}),
              ...(input.completed !== undefined
                ? { completed: input.completed }
                : {}),
              updatedAt: now,
            })
            .where(and(eq(table.id, id), eq(table.userId, userId)));
      } else if (input.entity === "note") {
        if (request.method === "POST")
          await db
            .insert(tables.notes)
            .values({
              id,
              userId,
              title: short.parse(input.title),
              body: input.body || "",
            });
        else
          await db
            .update(tables.notes)
            .set({
              ...(input.title ? { title: input.title } : {}),
              ...(input.body !== undefined ? { body: input.body } : {}),
              updatedAt: now,
            })
            .where(and(eq(table.id, id), eq(table.userId, userId)));
      } else if (input.entity === "podcast") {
        if (input.collectionId) {
          const [owned] = await db
            .select()
            .from(tables.collections)
            .where(
              and(
                eq(tables.collections.id, input.collectionId),
                eq(tables.collections.userId, userId),
              ),
            )
            .limit(1);
          if (!owned)
            throw new HttpError(404, "This collection is unavailable.");
        }
        if (request.method === "POST") {
          const link = validateSpotifyUrl(input.url || "");
          if (!link)
            throw new HttpError(
              400,
              "Use an https://open.spotify.com/show/… or /episode/… link.",
            );
          let metadata;
          try {
            metadata = await fetchSpotifyMetadata(link);
          } catch {
            throw new HttpError(
              422,
              "Spotify could not verify this podcast. Check the link and try again.",
            );
          }
          const [existing] = await db
            .select()
            .from(tables.savedPodcasts)
            .where(
              and(
                eq(tables.savedPodcasts.url, metadata.url),
                eq(tables.savedPodcasts.userId, userId),
              ),
            )
            .limit(1);
          if (existing)
            throw new HttpError(
              409,
              "This podcast is already in your library.",
            );
          await db
            .insert(tables.savedPodcasts)
            .values({
              id,
              userId,
              url: metadata.url,
              title: metadata.title,
              kind: metadata.kind,
              spotifyId: metadata.spotifyId,
              collectionId: input.collectionId,
            });
        } else
          await db
            .update(tables.savedPodcasts)
            .set({ collectionId: input.collectionId ?? null, updatedAt: now })
            .where(and(eq(table.id, id), eq(table.userId, userId)));
      }
    }
    return NextResponse.json({ ok: true, id, ...(await getLibrary(userId)) });
  } catch (error) {
    return apiError(error);
  }
}
export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
