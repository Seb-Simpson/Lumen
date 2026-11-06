import { NextResponse } from "next/server";
import { getAccountData, getSession } from "@/lib/services";
import { apiError, HttpError, rateLimit } from "@/lib/security";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const session = await getSession();
    if (!session) throw new HttpError(401, "Sign in to export your data.");
    rateLimit(`export:${session.user.id}`, 3, 60000);
    return NextResponse.json(
      {
        exportedAt: new Date().toISOString(),
        profile: session.user,
        ...(await getAccountData(session.user.id)),
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
          "Content-Disposition": 'attachment; filename="lumen-your-data.json"',
        },
      },
    );
  } catch (error) {
    return apiError(error);
  }
}
