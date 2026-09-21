"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import type { AlertThresholds } from "@/lib/thresholds";
import type { FloodReport, FloodState } from "@/types/floodReport";

interface AdminUserRow {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "admin";
  thresholds: AlertThresholds;
  createdAt: string;
  updatedAt: string;
  pushDeviceCount: number;
}

interface AdminPushRow {
  id: string;
  endpointPreview: string;
  userId: string | null;
  userEmail: string | null;
  status: "linked" | "anonymous" | "orphan";
  devicesForUser: number;
  userAgent: string | null;
  lastNotifiedForecastMoment: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminOverview {
  stats: {
    userCount: number;
    adminCount: number;
    pushCount: number;
    pushAccountCount: number;
    pushAnonymousCount: number;
    pushOrphanCount: number;
    floodReportCount: number;
  };
  users: AdminUserRow[];
  pushSubscriptions: AdminPushRow[];
  floodReports: FloodReport[];
}

const FLOOD_STATE_LABEL: Record<FloodState, string> = {
  "no-water": "Sin agua",
  "low-flood": "Inundación baja",
  "high-flood": "Inundación alta",
  evacuation: "Evacuación",
};

function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function displayName(user: AdminUserRow): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || "—";
}

function shortUserAgent(ua: string | null): string {
  if (!ua) return "—";
  return ua.length > 72 ? `${ua.slice(0, 69)}…` : ua;
}

export default function AdminPage() {
  const { user, loading, isAdmin, isLoggedIn } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [cleaningOrphans, setCleaningOrphans] = useState(false);

  const loadOverview = useCallback(async () => {
    const res = await fetch("/api/admin/overview", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo cargar el panel");
    setOverview(data);
  }, []);

  useEffect(() => {
    if (loading || !isAdmin) return;
    let cancelled = false;
    setFetching(true);
    loadOverview()
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar");
        }
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, isAdmin, loadOverview]);

  const handleUnlinkOrphans = async () => {
    setCleaningOrphans(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/push/orphans", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron limpiar");
      await loadOverview();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al limpiar huérfanas");
    } finally {
      setCleaningOrphans(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Cargando…
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Acceso restringido
          </h1>
          <p className="text-gray-600 mb-6">
            Esta pantalla es solo para administradores.
          </p>
          <Link
            href={isLoggedIn ? "/" : "/config"}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg"
          >
            {isLoggedIn ? "Volver al inicio" : "Iniciar sesión"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-800">
              Administración
            </h1>
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none px-3 py-1"
              aria-label="Volver"
            >
              ×
            </Link>
          </div>
          <p className="text-gray-600">
            Vista de datos de la app. Sesión:{" "}
            <span className="font-medium">{user?.email}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/config"
              className="text-sm text-blue-700 hover:text-blue-900 underline"
            >
              Configuración de cuenta
            </Link>
            <Link
              href="/analytics"
              className="text-sm text-blue-700 hover:text-blue-900 underline"
            >
              Analíticas
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {fetching && !overview && (
          <p className="text-gray-600 mb-6">Cargando datos…</p>
        )}

        {overview && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <StatCard label="Usuarios" value={overview.stats.userCount} />
              <StatCard label="Admins" value={overview.stats.adminCount} />
              <StatCard
                label="Push activas"
                value={overview.stats.pushCount}
              />
              <StatCard
                label="Cuentas con push"
                value={overview.stats.pushAccountCount}
              />
              <StatCard
                label="Reportes"
                value={overview.stats.floodReportCount}
              />
            </div>

            <section className="bg-white rounded-xl shadow-lg p-6 mb-6 overflow-x-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Usuarios registrados
              </h2>
              {overview.users.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay usuarios.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="py-2 pr-3 font-semibold">Nombre</th>
                      <th className="py-2 pr-3 font-semibold">Email</th>
                      <th className="py-2 pr-3 font-semibold">Rol</th>
                      <th className="py-2 pr-3 font-semibold">Push</th>
                      <th className="py-2 pr-3 font-semibold">Umbrales</th>
                      <th className="py-2 font-semibold">Alta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.users.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-2 pr-3 text-gray-800">
                          {displayName(row)}
                        </td>
                        <td className="py-2 pr-3 text-gray-800 break-all">
                          {row.email}
                        </td>
                        <td className="py-2 pr-3">
                          <RoleBadge role={row.role} />
                        </td>
                        <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">
                          {row.pushDeviceCount > 0
                            ? `${row.pushDeviceCount} disp.`
                            : "—"}
                        </td>
                        <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">
                          {row.thresholds.warning.toFixed(1)} /{" "}
                          {row.thresholds.alert.toFixed(1)} /{" "}
                          {row.thresholds.critical.toFixed(1)} m
                        </td>
                        <td className="py-2 text-gray-600 whitespace-nowrap">
                          {formatDate(row.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="bg-white rounded-xl shadow-lg p-6 mb-6 overflow-x-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Notificaciones push activas
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Un mismo usuario puede tener varias suscripciones (celular,
                navegador o PWA). Las anónimas son dispositivos sin sesión y
                usan umbrales por defecto. Si una cuenta se borra, la push
                queda huérfana: sigue avisando con umbrales globales hasta que
                el endpoint muera (404/410) y el servidor la elimine.
              </p>
              <p className="text-sm text-gray-700 mb-4">
                {overview.stats.pushCount} suscripciones ·{" "}
                {overview.stats.pushAccountCount} cuentas ·{" "}
                {overview.stats.pushAnonymousCount} anónimas ·{" "}
                {overview.stats.pushOrphanCount} huérfanas
              </p>
              {overview.stats.pushOrphanCount > 0 && (
                <button
                  type="button"
                  onClick={handleUnlinkOrphans}
                  disabled={cleaningOrphans}
                  className="mb-4 text-sm bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium px-3 py-2 rounded-lg disabled:opacity-70"
                >
                  {cleaningOrphans
                    ? "Limpiando…"
                    : "Desvincular huérfanas (pasan a anónimas)"}
                </button>
              )}
              {overview.pushSubscriptions.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No hay suscripciones push.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="py-2 pr-3 font-semibold">Usuario</th>
                      <th className="py-2 pr-3 font-semibold">Estado</th>
                      <th className="py-2 pr-3 font-semibold">Endpoint</th>
                      <th className="py-2 pr-3 font-semibold">Dispositivo</th>
                      <th className="py-2 pr-3 font-semibold">Último aviso</th>
                      <th className="py-2 font-semibold">Actualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.pushSubscriptions.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-2 pr-3 text-gray-800">
                          {row.status === "linked" ? (
                            <span>
                              {row.userEmail}
                              {row.devicesForUser > 1 && (
                                <span className="ml-2 text-xs font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">
                                  {row.devicesForUser} disp.
                                </span>
                              )}
                            </span>
                          ) : row.status === "orphan" ? (
                            <span className="text-amber-800">
                              Cuenta eliminada
                            </span>
                          ) : (
                            <span className="text-gray-400">Anónimo</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <PushStatusBadge status={row.status} />
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs text-gray-600 break-all">
                          {row.endpointPreview}
                        </td>
                        <td
                          className="py-2 pr-3 text-gray-600 max-w-xs truncate"
                          title={row.userAgent ?? undefined}
                        >
                          {shortUserAgent(row.userAgent)}
                        </td>
                        <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">
                          {formatDate(row.lastNotifiedForecastMoment)}
                        </td>
                        <td className="py-2 text-gray-600 whitespace-nowrap">
                          {formatDate(row.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="bg-white rounded-xl shadow-lg p-6 mb-6 overflow-x-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Reportes de inundación recientes
              </h2>
              {overview.floodReports.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay reportes.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="py-2 pr-3 font-semibold">Fecha</th>
                      <th className="py-2 pr-3 font-semibold">Estado</th>
                      <th className="py-2 pr-3 font-semibold">Reportero</th>
                      <th className="py-2 pr-3 font-semibold">Ubicación</th>
                      <th className="py-2 font-semibold">Marea</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.floodReports.map((row, index) => (
                      <tr
                        key={row._id ?? `${row.timestamp}-${index}`}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">
                          {formatDate(row.timestamp)}
                        </td>
                        <td className="py-2 pr-3 text-gray-800">
                          {FLOOD_STATE_LABEL[row.state] ?? row.state}
                        </td>
                        <td className="py-2 pr-3 text-gray-800">
                          {row.reporterName || row.reporterEmail || (
                            <span className="text-gray-400">Anónimo</span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">
                          {row.location.latitude.toFixed(4)},{" "}
                          {row.location.longitude.toFixed(4)}
                        </td>
                        <td className="py-2 text-gray-600">
                          {row.tideHeight != null
                            ? `${row.tideHeight.toFixed(2)} m`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );
}

function PushStatusBadge({
  status,
}: {
  status: "linked" | "anonymous" | "orphan";
}) {
  const styles = {
    linked: "bg-green-100 text-green-800",
    anonymous: "bg-gray-100 text-gray-700",
    orphan: "bg-amber-100 text-amber-900",
  };
  const labels = {
    linked: "con cuenta",
    anonymous: "anónima",
    orphan: "huérfana",
  };
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function RoleBadge({ role }: { role: "user" | "admin" }) {
  const isAdminRole = role === "admin";
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
        isAdminRole
          ? "bg-indigo-100 text-indigo-800"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {isAdminRole ? "admin" : "user"}
    </span>
  );
}
