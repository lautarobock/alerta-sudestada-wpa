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

export async function resolveThresholdsForSubscription(
  sub: PushSubscriptionDocument
): Promise<AlertThresholds> {
  if (sub.userId) {
    const user = await findUserById(sub.userId.toString());
    if (user?.thresholds) return user.thresholds;
  }
  return getDefaultThresholds();
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
