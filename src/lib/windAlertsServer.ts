import "server-only";

import { getSessionFromCookies } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/users";
import { getDefaultWindAlerts } from "@/lib/settingsServer";
import {
  normalizeWindAlertsConfig,
  type WindAlertsConfig,
} from "@/lib/windAlerts";
import type { PushSubscriptionDocument } from "@/lib/push/subscriptions";

export async function resolveWindAlertsForSession(): Promise<WindAlertsConfig> {
  const defaults = await getDefaultWindAlerts();
  const session = await getSessionFromCookies();
  if (!session) return defaults;

  const user = await findUserById(session.userId);
  if (!user?.windAlerts) return defaults;

  return normalizeWindAlertsConfig(user.windAlerts, defaults);
}

export async function resolveWindAlertsForSubscription(
  sub: PushSubscriptionDocument
): Promise<WindAlertsConfig> {
  const defaults = await getDefaultWindAlerts();
  if (!sub.userId) return defaults;

  const user = await findUserById(sub.userId.toString());
  if (!user) return defaults;

  return normalizeWindAlertsConfig(user.windAlerts, defaults);
}
