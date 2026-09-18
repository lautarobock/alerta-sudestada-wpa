"use client";

import { useCallback, useEffect, useState } from "react";
import type { AlertThresholds } from "@/lib/thresholds";
import { DEFAULT_THRESHOLDS } from "@/lib/thresholds";

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  thresholds: AlertThresholds;
}

interface MeResponse {
  user: AuthUser | null;
  thresholds: AlertThresholds;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) {
      setUser(null);
      setThresholds(DEFAULT_THRESHOLDS);
      return;
    }
    const data: MeResponse = await res.json();
    setUser(data.user);
    setThresholds(data.thresholds ?? DEFAULT_THRESHOLDS);
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
    return data.user as AuthUser;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setThresholds(DEFAULT_THRESHOLDS);
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
    window.dispatchEvent(
      new CustomEvent("thresholdsUpdated", { detail: data.user.thresholds })
    );
  };

  return {
    user,
    thresholds,
    loading,
    refresh,
    register,
    login,
    logout,
    saveThresholds,
    isLoggedIn: !!user,
  };
}
