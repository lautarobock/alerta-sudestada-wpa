import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getDefaultThresholds, type AlertThresholds } from "@/lib/thresholds";
import { findUserById } from "@/lib/auth/users";

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionDocument {
  _id: ObjectId;
  endpoint: string;
  keys: PushSubscriptionKeys;
  userId?: ObjectId | null;
  userAgent?: string;
  lastNotifiedForecastMoment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

async function subscriptionsCollection() {
  const client = await clientPromise;
  return client
    .db("alerta-sudestada")
    .collection<PushSubscriptionDocument>("pushSubscriptions");
}

export async function upsertPushSubscription(
  input: PushSubscriptionInput,
  userId?: string | null,
  userAgent?: string
): Promise<void> {
  const collection = await subscriptionsCollection();
  const now = new Date();
  const set: Partial<PushSubscriptionDocument> = {
    keys: input.keys,
    updatedAt: now,
  };
  if (userAgent) set.userAgent = userAgent;
  if (userId && ObjectId.isValid(userId)) {
    set.userId = new ObjectId(userId);
  }

  await collection.updateOne(
    { endpoint: input.endpoint },
    {
      $set: set,
      $setOnInsert: {
        endpoint: input.endpoint,
        createdAt: now,
        lastNotifiedForecastMoment: null,
      },
    },
    { upsert: true }
  );
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const collection = await subscriptionsCollection();
  await collection.deleteOne({ endpoint });
}

export async function listPushSubscriptions(): Promise<
  PushSubscriptionDocument[]
> {
  const collection = await subscriptionsCollection();
  return collection.find({}).toArray();
}

export type AdminPushStatus = "linked" | "anonymous" | "orphan";

export interface AdminPushSubscriptionItem {
  id: string;
  endpointPreview: string;
  userId: string | null;
  userEmail: string | null;
  status: AdminPushStatus;
  devicesForUser: number;
  userAgent: string | null;
  lastNotifiedForecastMoment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function previewEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    const tail = url.pathname.slice(-28);
    return `${url.host}…${tail}`;
  } catch {
    return endpoint.slice(-40);
  }
}

export async function listPushSubscriptionsForAdmin(): Promise<
  AdminPushSubscriptionItem[]
> {
  const collection = await subscriptionsCollection();
  const docs = await collection.find({}).sort({ updatedAt: -1 }).toArray();

  const uniqueUserIds = [
    ...new Set(
      docs
        .map((sub) => sub.userId?.toString())
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const users = await Promise.all(uniqueUserIds.map((id) => findUserById(id)));
  const userById = new Map(
    uniqueUserIds.map((id, index) => [id, users[index]] as const)
  );

  const devicesByUserId = new Map<string, number>();
  for (const sub of docs) {
    const id = sub.userId?.toString();
    if (!id) continue;
    devicesByUserId.set(id, (devicesByUserId.get(id) ?? 0) + 1);
  }

  return docs.map((sub) => {
    const userId = sub.userId?.toString() ?? null;
    const user = userId ? userById.get(userId) ?? null : null;
    let status: AdminPushStatus = "anonymous";
    if (userId && user) status = "linked";
    else if (userId) status = "orphan";

    return {
      id: sub._id.toString(),
      endpointPreview: previewEndpoint(sub.endpoint),
      userId,
      userEmail: user?.email ?? null,
      status,
      devicesForUser: userId ? (devicesByUserId.get(userId) ?? 1) : 1,
      userAgent: sub.userAgent ?? null,
      lastNotifiedForecastMoment: sub.lastNotifiedForecastMoment ?? null,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  });
}

/** Clear userId on subscriptions whose account no longer exists. */
export async function unlinkOrphanPushSubscriptions(): Promise<number> {
  const collection = await subscriptionsCollection();
  const docs = await collection
    .find({ userId: { $exists: true, $ne: null } })
    .toArray();

  let unlinked = 0;
  for (const sub of docs) {
    if (!sub.userId) continue;
    const user = await findUserById(sub.userId.toString());
    if (user) continue;
    await collection.updateOne(
      { _id: sub._id },
      { $set: { userId: null, updatedAt: new Date() } }
    );
    unlinked++;
  }
  return unlinked;
}

export async function resolveThresholdsForSubscription(
  sub: PushSubscriptionDocument
): Promise<AlertThresholds> {
  if (sub.userId) {
    const user = await findUserById(sub.userId.toString());
    if (user?.thresholds) return user.thresholds;
  }
  return await getDefaultThresholds();
}

export async function markSubscriptionNotified(
  endpoint: string,
  forecastMomentIso: string
): Promise<void> {
  const collection = await subscriptionsCollection();
  await collection.updateOne(
    { endpoint },
    {
      $set: {
        lastNotifiedForecastMoment: forecastMomentIso,
        updatedAt: new Date(),
      },
    }
  );
}

export async function removeStaleSubscription(endpoint: string): Promise<void> {
  await deletePushSubscription(endpoint);
}
