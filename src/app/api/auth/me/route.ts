import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { findUserById, toPublicUser } from "@/lib/auth/users";
import { getDefaultThresholds } from "@/lib/thresholdsServer";

export async function GET() {
  const defaults = await getDefaultThresholds();
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({
      user: null,
      thresholds: defaults,
    });
  }

  const user = await findUserById(session.userId);
  if (!user) {
    return NextResponse.json({
      user: null,
      thresholds: defaults,
    });
  }

  return NextResponse.json({
    user: toPublicUser(user),
    thresholds: user.thresholds,
  });
}
