import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { upsertPushSubscription } from "@/lib/push/subscriptions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
    const keys = body.keys;
    if (
      !endpoint ||
      !keys ||
      typeof keys.p256dh !== "string" ||
      typeof keys.auth !== "string"
    ) {
      return NextResponse.json(
        { error: "Suscripción inválida" },
        { status: 400 }
      );
    }

    const session = await getSessionFromCookies();
    const userAgent = request.headers.get("user-agent") ?? undefined;

    await upsertPushSubscription(
      { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
      session?.userId ?? null,
      userAgent
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: "Error al suscribir" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint requerido" }, { status: 400 });
    }
    const { deletePushSubscription } = await import("@/lib/push/subscriptions");
    await deletePushSubscription(endpoint);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json({ error: "Error al desuscribir" }, { status: 500 });
  }
}
