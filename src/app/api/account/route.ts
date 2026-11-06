import { getAuth } from "@/lib/auth";
import { getSession } from "@/lib/services";
import {
  apiError,
  assertSameOrigin,
  HttpError,
  rateLimit,
  readJson,
} from "@/lib/security";
import { headers } from "next/headers";
import { z } from "zod";
export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await getSession();
    if (!session) throw new HttpError(401, "Sign in to delete your account.");
    rateLimit(`delete:${session.user.id}`, 3);
    const input = z
      .object({ password: z.string().min(1).max(128) })
      .strict()
      .parse(await readJson(request));
    const auth = await getAuth();
    return await auth.api.deleteUser({
      headers: await headers(),
      body: { password: input.password },
      asResponse: true,
    });
  } catch (error) {
    return apiError(error);
  }
}
