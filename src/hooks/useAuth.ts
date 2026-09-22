"use client";

import { useCallback, useEffect, useState } from "react";
import { syncPushSubscriptionWithServer } from "@/utils/webPush";
import type { AlertThresholds } from "@/lib/thresholds";
import { DEFAULT_THRESHOLDS } from "@/lib/thresholds";
import {
  defaultWindSettings,
  windSettingsToAlertsConfig,
  type WindAlertsConfig,
} from "@/lib/windAlerts";

const CLIENT_WIND_DEFAULTS: WindAlertsConfig = windSettingsToAlertsConfig(
  defaultWindSettings()
);

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "admin";
  thresholds: AlertThresholds;
  windAlerts: WindAlertsConfig;
}

interface MeResponse {
  user: AuthUser | null;
  thresholds: AlertThresholds;
  windDefaults: WindAlertsConfig;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  const [windAlerts, setWindAlerts] = useState<WindAlertsConfig>(CLIENT_WIND_DEFAULTS);
  const [windDefaults, setWindDefaults] = useState<WindAlertsConfig>(CLIENT_WIND_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) {
      setUser(null);
      setThresholds(DEFAULT_THRESHOLDS);
      setWindAlerts(CLIENT_WIND_DEFAULTS);
      return;
    }
    const data: MeResponse = await res.json();
    setWindDefaults(data.windDefaults ?? CLIENT_WIND_DEFAULTS);
    setUser(data.user);
    setThresholds(data.user?.thresholds ?? data.thresholds ?? DEFAULT_THRESHOLDS);
    setWindAlerts(
      data.user?.windAlerts ?? data.windDefaults ?? CLIENT_WIND_DEFAULTS
    );
    if (data.user) {
      syncPushSubscriptionWithServer().catch(() => {});
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const register = async (input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al registrar");
    setUser(data.user);
    setThresholds(data.user.thresholds);
    setWindAlerts(data.user.windAlerts);
    await syncPushSubscriptionWithServer();
    return data.user as AuthUser;
  };

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");
    setUser(data.user);
    setThresholds(data.user.thresholds);
    setWindAlerts(data.user.windAlerts);
    await syncPushSubscriptionWithServer();
    return data.user as AuthUser;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setThresholds(DEFAULT_THRESHOLDS);
    setWindAlerts(windDefaults);
  };

  const saveThresholds = async (next: AlertThresholds) => {
    const res = await fetch("/api/auth/thresholds", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(next),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al guardar");
    setUser(data.user);
    setThresholds(data.user.thresholds);
    setWindAlerts(data.user.windAlerts);
    window.dispatchEvent(
      new CustomEvent("thresholdsUpdated", { detail: data.user.thresholds })
    );
  };

  const saveWindAlerts = async (next: WindAlertsConfig) => {
    const res = await fetch("/api/auth/wind-alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(next),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al guardar");
    setUser(data.user);
    setWindAlerts(data.user.windAlerts);
    await syncPushSubscriptionWithServer();
    window.dispatchEvent(
      new CustomEvent("windAlertsUpdated", { detail: data.user.windAlerts })
    );
  };

  return {
    user,
    thresholds,
    windAlerts,
    windDefaults,
    loading,
    refresh,
    register,
    login,
    logout,
    saveThresholds,
    saveWindAlerts,
    isLoggedIn: !!user,
    isAdmin: user?.role === "admin",
  };
}
