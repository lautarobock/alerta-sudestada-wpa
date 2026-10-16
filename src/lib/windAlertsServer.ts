import "server-only";

import { getSessionFromCookies } from "@/lib/auth/session";
import { findUserById, findUsersByIds } from "@/lib/auth/users";
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
  const prefs = await resolveWindAlertsForSubscriptions([sub]);
  return prefs.get(sub.endpoint) ?? (await getDefaultWindAlerts());
}

/** One settings read and one users query for the whole push check. */
export async function resolveWindAlertsForSubscriptions(
  subs: PushSubscriptionDocument[]
): Promise<Map<string, WindAlertsConfig>> {
  const defaults = await getDefaultWindAlerts();
  const users = await findUsersByIds(
    subs
      .map((sub) => sub.userId?.toString())
      .filter((id): id is string => Boolean(id))
  );

  const prefs = new Map<string, WindAlertsConfig>();
  for (const sub of subs) {
    const user = sub.userId ? users.get(sub.userId.toString()) : undefined;
    prefs.set(
      sub.endpoint,
      user ? normalizeWindAlertsConfig(user.windAlerts, defaults) : defaults
    );
  }
  return prefs;
}
