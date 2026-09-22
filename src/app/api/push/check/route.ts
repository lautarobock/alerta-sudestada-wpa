import { NextRequest, NextResponse } from "next/server";
import { runPushCheck } from "@/lib/push/checkForecast";
import { runWindPushCheck } from "@/lib/push/checkWindForecast";

function verifyWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  return auth.slice(7) === secret;
}

export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [river, wind] = await Promise.allSettled([
      runPushCheck(),
      runWindPushCheck(),
    ]);

    if (river.status === "rejected") {
      console.error("River push check error:", river.reason);
    }
    if (wind.status === "rejected") {
      console.error("Wind push check error:", wind.reason);
    }

    const riverResult =
      river.status === "fulfilled"
        ? river.value
        : {
            forecastMoment: null,
            subscriptionsChecked: 0,
            notificationsSent: 0,
            skipped: 0,
            errors: 1,
          };
    const windResult =
      wind.status === "fulfilled"
        ? wind.value
        : {
            slotsChecked: 0,
            notificationsSent: 0,
            skipped: 0,
            errors: 1,
          };

    if (river.status === "rejected" && wind.status === "rejected") {
      return NextResponse.json({ error: "Push check failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ...riverResult,
      wind: windResult,
      notified:
        riverResult.notificationsSent > 0 || windResult.notificationsSent > 0,
    });
  } catch (error) {
    console.error("Push check error:", error);
    return NextResponse.json({ error: "Push check failed" }, { status: 500 });
  }
}
