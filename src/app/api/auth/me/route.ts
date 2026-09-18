import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { findUserById, toPublicUser } from "@/lib/auth/users";
import { DEFAULT_THRESHOLDS } from "@/lib/thresholds";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({
      user: null,
      thresholds: DEFAULT_THRESHOLDS,
    });
  }

  const user = await findUserById(session.userId);
  if (!user) {
    return NextResponse.json({
      user: null,
      thresholds: DEFAULT_THRESHOLDS,
    });
  }

  return NextResponse.json({
    user: toPublicUser(user),
    thresholds: user.thresholds,
  });
}
