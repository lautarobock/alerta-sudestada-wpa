import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push/webPush";

export async function GET() {
  try {
    return NextResponse.json({ publicKey: getVapidPublicKey() });
  } catch {
    return NextResponse.json(
      { error: "Push no configurado" },
      { status: 503 }
    );
  }
}
