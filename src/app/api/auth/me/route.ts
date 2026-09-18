import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { findUserById, toPublicUser } from "@/lib/auth/users";
import { getDefaultThresholds } from "@/lib/thresholds";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({
      user: null,
      thresholds: getDefaultThresholds(),
    });
  }

  const user = await findUserById(session.userId);
  if (!user) {
    return NextResponse.json({
      user: null,
      thresholds: getDefaultThresholds(),
    });
  }

  return NextResponse.json({
    user: toPublicUser(user),
    thresholds: user.thresholds,
  });
}
