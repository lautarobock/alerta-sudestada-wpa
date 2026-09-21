import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { unlinkOrphanPushSubscriptions } from "@/lib/push/subscriptions";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const unlinked = await unlinkOrphanPushSubscriptions();
  return NextResponse.json({ success: true, unlinked });
}
