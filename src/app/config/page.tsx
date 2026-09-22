"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ThresholdSlider from "@/components/ThresholdSlider";
import WindDirectionPicker from "@/components/WindDirectionPicker";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_THRESHOLDS, type AlertThresholds } from "@/lib/thresholds";
import type { WindAlertsConfig } from "@/lib/windAlerts";
import {
  getNotificationPermissionStatus,
  subscribeToWebPushDetailed,
  unsubscribeFromWebPush,
  syncPushSubscriptionWithServer,
} from "@/utils/webPush";

export default function ConfigPage() {
  const {
    user,
    thresholds,
    loading,
    isLoggedIn,
    register,
    login,
    logout,
    saveThresholds,
    saveWindAlerts,
    windAlerts,
    windDefaults,
  } = useAuth();

  const [draft, setDraft] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  const [windDraft, setWindDraft] = useState<WindAlertsConfig>(windDefaults);
  const [isSaved, setIsSaved] = useState(false);
  const [isWindSaved, setIsWindSaved] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [pushLoading, setPushLoading] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    ReturnType<typeof getNotificationPermissionStatus>
  >("default");

  useEffect(() => {
    setDraft(thresholds);
  }, [thresholds]);

  useEffect(() => {
    setWindDraft(windAlerts);
  }, [windAlerts]);

  useEffect(() => {
    setPermissionStatus(getNotificationPermissionStatus());
  }, []);

  const handleSave = async () => {
    if (!isLoggedIn) return;
    try {
      await saveThresholds(draft);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Error al guardar la configuración."
      );
    }
  };

  const handleReset = () => {
    setDraft({ ...thresholds });
    setIsSaved(false);
  };

  const handleSaveWind = async () => {
    if (!isLoggedIn) return;
    try {
      await saveWindAlerts(windDraft);
      setIsWindSaved(true);
      setTimeout(() => setIsWindSaved(false), 3000);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Error al guardar la configuración de viento."
      );
    }
  };

  const handleResetWind = () => {
    setWindDraft({ ...windAlerts });
    setIsWindSaved(false);
  };

  const handleActivatePush = async () => {
    setPushLoading(true);
    setPushFeedback(null);
    try {
      const result = await subscribeToWebPushDetailed();
      setPermissionStatus(getNotificationPermissionStatus());
      setPushFeedback({
        type: result.ok ? "success" : "error",
        text: result.message,
      });
    } catch (e) {
      setPushFeedback({
        type: "error",
        text: e instanceof Error ? e.message : "Error inesperado al activar notificaciones.",
      });
    } finally {
      setPushLoading(false);
    }
  };

  const handleDeactivatePush = async () => {
    setPushLoading(true);
    setPushFeedback(null);
    try {
      const result = await unsubscribeFromWebPush();
      setPermissionStatus(getNotificationPermissionStatus());
      setPushFeedback({
        type: result.ok ? "info" : "error",
        text: result.message,
      });
    } catch (e) {
      setPushFeedback({
        type: "error",
        text: e instanceof Error ? e.message : "Error inesperado.",
      });
    } finally {
      setPushLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (authMode === "register") {
        await register({ email, password, firstName, lastName });
      } else {
        await login(email, password);
      }
      await syncPushSubscriptionWithServer();
      setPassword("");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Error");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Cargando configuración…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Configuración</h1>
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors text-2xl font-bold leading-none px-3 py-1"
              aria-label="Volver"
            >
              ×
            </Link>
          </div>
          <p className="text-gray-600">
            Los umbrales por defecto vienen del servidor. Para personalizarlos y
            usarlos en todos tus dispositivos, creá una cuenta.
          </p>
        </div>

        {!isLoggedIn && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Cuenta (opcional)
            </h2>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  authMode === "register"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Registrarse
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  authMode === "login"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Iniciar sesión
              </button>
            </div>
            <form onSubmit={handleAuth} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Contraseña (mín. 8 caracteres) *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              {authMode === "register" && (
                <>
                  <input
                    type="text"
                    placeholder="Nombre (opcional)"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Apellido (opcional)"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </>
              )}
              {authError && (
                <p className="text-red-600 text-sm">{authError}</p>
              )}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-70"
              >
                {authLoading
                  ? "Procesando…"
                  : authMode === "register"
                    ? "Crear cuenta"
                    : "Entrar"}
              </button>
            </form>
          </div>
        )}

        {isLoggedIn && user && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-2">
            <p className="text-green-900 text-sm">
              Sesión: <span className="font-medium">{user.email}</span>
              {user.role === "admin" && (
                <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                  admin
                </span>
              )}
            </p>
            <div className="flex items-center gap-3">
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm text-indigo-800 underline hover:text-indigo-950"
                >
                  Panel de administración
                </Link>
              )}
              <button
                type="button"
                onClick={() => logout()}
                className="text-sm text-green-800 underline hover:text-green-950"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Límites de alerta
          </h2>
          {!isLoggedIn && (
            <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm mb-4">
              Solo lectura: valores por defecto del servidor. Creá una cuenta para
              editarlos y sincronizarlos entre dispositivos.
            </p>
          )}

          <ThresholdSlider
            min={0}
            max={5}
            step={0.1}
            values={isLoggedIn ? draft : thresholds}
            onChange={isLoggedIn ? setDraft : () => {}}
            disabled={!isLoggedIn}
            labels={{
              warning: "Advertencia",
              alert: "Alerta",
              critical: "Crítico",
            }}
          />

          {isLoggedIn && (
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
              >
                {isSaved ? "✓ Guardado" : "Guardar cambios"}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Restablecer defaults
              </button>
            </div>
          )}

          {isSaved && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-lg text-sm">
              ✓ Configuración guardada en tu cuenta
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Alertas de viento
          </h2>
          {!isLoggedIn && (
            <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm mb-4">
              Solo lectura: defaults del servidor. Con cuenta podés personalizar
              rumbos, umbrales y desactivar notificaciones de viento.
            </p>
          )}

          {isLoggedIn && (
            <label className="flex items-center gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={windDraft.notificationsEnabled}
                onChange={(e) =>
                  setWindDraft({
                    ...windDraft,
                    notificationsEnabled: e.target.checked,
                  })
                }
                className="h-5 w-5 rounded border-gray-300"
              />
              <span className="text-gray-800 font-medium">
                Recibir notificaciones de viento (pronóstico)
              </span>
            </label>
          )}

          <ThresholdSlider
            min={0}
            max={120}
            step={1}
            unit="km/h"
            values={isLoggedIn ? windDraft.speedKmh : windDefaults.speedKmh}
            onChange={(speedKmh) =>
              isLoggedIn && setWindDraft({ ...windDraft, speedKmh })
            }
            disabled={!isLoggedIn}
            labels={{
              warning: "Advertencia",
              alert: "Alerta",
              critical: "Crítico",
            }}
          />

          <div className="mt-8">
            <h3 className="font-semibold text-gray-800 mb-3 text-center">
              Direcciones de origen del viento
            </h3>
            <WindDirectionPicker
              directions={
                isLoggedIn ? windDraft.directions : windDefaults.directions
              }
              onChange={(directions) =>
                isLoggedIn && setWindDraft({ ...windDraft, directions })
              }
              disabled={!isLoggedIn}
            />
          </div>

          <p className="text-sm text-gray-600 mt-4">
            El widget y las notificaciones usan velocidad ≥ alerta en los rumbos
            seleccionados. Las push solo se envían en nivel alerta o crítico.
          </p>

          {isLoggedIn && (
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSaveWind}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
              >
                {isWindSaved ? "✓ Guardado" : "Guardar viento"}
              </button>
              <button
                onClick={handleResetWind}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Restablecer
              </button>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Notificaciones push</h3>
          <p className="text-sm text-blue-800 mb-3">
            Las alertas las envía el servidor según el <strong>pronóstico</strong>.
            Cada celular o navegador debe registrarse una vez.
          </p>
          <p className="text-sm text-blue-900 mb-4">
            Permiso del sistema:{" "}
            <span className="font-medium">
              {permissionStatus === "granted" && "✓ Concedido"}
              {permissionStatus === "denied" && "✗ Bloqueado"}
              {permissionStatus === "default" && "Sin definir (tocá Activar)"}
              {permissionStatus === "unsupported" && "No soportado"}
            </span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleActivatePush}
              disabled={pushLoading || permissionStatus === "unsupported"}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-70 transition-colors"
            >
              {pushLoading ? "Procesando…" : "Activar notificaciones"}
            </button>
            <button
              type="button"
              onClick={handleDeactivatePush}
              disabled={pushLoading}
              className="px-6 py-3 bg-white border border-blue-300 text-blue-900 font-medium rounded-lg hover:bg-blue-100 disabled:opacity-70 transition-colors"
            >
              Desactivar en este dispositivo
            </button>
          </div>
          {pushFeedback && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm border ${
                pushFeedback.type === "success"
                  ? "bg-green-100 border-green-300 text-green-900"
                  : pushFeedback.type === "error"
                    ? "bg-red-100 border-red-300 text-red-900"
                    : "bg-white border-blue-200 text-blue-900"
              }`}
            >
              {pushFeedback.text}
            </div>
          )}
          <ul className="text-sm text-blue-800 space-y-1 mt-4">
            <li>• Sin cuenta: umbrales globales del servidor</li>
            <li>• Con cuenta: tus umbrales de marea y viento en todos los dispositivos</li>
            <li>• Podés desactivar solo las notificaciones de viento en Alertas de viento</li>
            <li>• Si actualizaste la app, usá Activar notificaciones o reinstalá la PWA</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
