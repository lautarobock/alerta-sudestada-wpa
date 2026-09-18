import { NextRequest, NextResponse } from "next/server";
import { runPushCheck } from "@/lib/push/checkForecast";

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
    const result = await runPushCheck();
    return NextResponse.json({
      success: true,
      ...result,
      notified: result.notificationsSent > 0,
    });
  } catch (error) {
    console.error("Push check error:", error);
    return NextResponse.json({ error: "Push check failed" }, { status: 500 });
  }
}
