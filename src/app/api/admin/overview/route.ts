import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listUsers } from "@/lib/auth/users";
import { listPushSubscriptionsForAdmin } from "@/lib/push/subscriptions";
import { getFloodReports } from "@/app/actions/floodReport";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const client = await clientPromise;
  const db = client.db("alerta-sudestada");

  const [users, pushSubscriptions, floodReports, floodReportCount] =
    await Promise.all([
      listUsers(),
      listPushSubscriptionsForAdmin(),
      getFloodReports(20),
      db.collection("floodReports").countDocuments(),
    ]);

  const linked = pushSubscriptions.filter((sub) => sub.status === "linked");
  const uniqueLinkedUserIds = new Set(
    linked.map((sub) => sub.userId).filter((id): id is string => Boolean(id))
  );
  const pushByUserId = new Map<string, number>();
  for (const sub of linked) {
    if (!sub.userId) continue;
    pushByUserId.set(sub.userId, (pushByUserId.get(sub.userId) ?? 0) + 1);
  }

  return NextResponse.json({
    stats: {
      userCount: users.length,
      adminCount: users.filter((user) => user.role === "admin").length,
      pushCount: pushSubscriptions.length,
      pushAccountCount: uniqueLinkedUserIds.size,
      pushAnonymousCount: pushSubscriptions.filter(
        (sub) => sub.status === "anonymous"
      ).length,
      pushOrphanCount: pushSubscriptions.filter((sub) => sub.status === "orphan")
        .length,
      floodReportCount,
    },
    users: users.map((user) => ({
      ...user,
      pushDeviceCount: pushByUserId.get(user.id) ?? 0,
    })),
    pushSubscriptions,
    floodReports,
  });
}
