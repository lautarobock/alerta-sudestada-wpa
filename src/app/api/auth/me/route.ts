import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { findUserById, toPublicUserResolved } from "@/lib/auth/users";
import { getDefaultThresholds } from "@/lib/thresholdsServer";
import { getDefaultWindAlerts } from "@/lib/settingsServer";

export async function GET() {
  const [defaults, windDefaults] = await Promise.all([
    getDefaultThresholds(),
    getDefaultWindAlerts(),
  ]);
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({
      user: null,
      thresholds: defaults,
      windDefaults,
    });
  }

  const user = await findUserById(session.userId);
  if (!user) {
    return NextResponse.json({
      user: null,
      thresholds: defaults,
      windDefaults,
    });
  }

  return NextResponse.json({
    user: await toPublicUserResolved(user),
    thresholds: user.thresholds,
    windDefaults,
  });
}
