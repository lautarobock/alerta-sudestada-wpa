"use client";

export type WebPushSubscribeResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getNotificationPermissionStatus():
  | "unsupported"
  | "granted"
  | "denied"
  | "default" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export async function subscribeToWebPushDetailed(): Promise<WebPushSubscribeResult> {
  if (!("serviceWorker" in navigator)) {
    return {
      ok: false,
      message:
        "Este navegador no soporta service workers. Instalá la app como PWA desde Chrome.",
    };
  }
  if (!("PushManager" in window)) {
    return {
      ok: false,
      message: "Push no está disponible en este navegador o contexto.",
    };
  }

  if (!("Notification" in window)) {
    return { ok: false, message: "Notificaciones no soportadas en este dispositivo." };
  }
  if (Notification.permission === "denied") {
    return {
      ok: false,
      message:
        "Notificaciones bloqueadas. Activálas en Ajustes → Apps → Alerta Sudestada (o permisos del sitio en Chrome).",
    };
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    return {
      ok: false,
      message: "No se otorgó permiso para notificaciones.",
    };
  }

  const keyRes = await fetch("/api/push/vapid-public-key");
  if (!keyRes.ok) {
    return {
      ok: false,
      message:
        keyRes.status === 503
          ? "Push no configurado en el servidor (VAPID). Contactá al administrador."
          : `No se pudo obtener la clave VAPID (${keyRes.status}).`,
    };
  }
  const keyData = await keyRes.json();
  const publicKey = keyData?.publicKey;
  if (!publicKey || typeof publicKey !== "string") {
    return { ok: false, message: "Respuesta inválida del servidor (clave VAPID)." };
  }

  let registration: ServiceWorkerRegistration;
  try {
    registration = await navigator.serviceWorker.ready;
  } catch {
    return {
      ok: false,
      message:
        "Service worker no listo. Recargá la página o reinstalá la PWA desde Chrome.",
    };
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        ok: false,
        message: `No se pudo suscribir al push: ${msg}. Probá reinstalar la PWA si cambió la configuración del servidor.`,
      };
    }
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, message: "Suscripción del navegador incompleta." };
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      if (body?.error) detail = `: ${body.error}`;
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      message: `El servidor no guardó la suscripción (${res.status})${detail}.`,
    };
  }

  return {
    ok: true,
    message:
      "Dispositivo registrado para alertas push. Recibirás avisos cuando el pronóstico supere los umbrales.",
  };
}

export async function subscribeToWebPush(): Promise<boolean> {
  const result = await subscribeToWebPushDetailed();
  return result.ok;
}

/** Re-associate current device subscription with logged-in user */
export async function syncPushSubscriptionWithServer(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  });
}

export async function unsubscribeFromWebPush(): Promise<WebPushSubscribeResult> {
  if (!("serviceWorker" in navigator)) {
    return { ok: false, message: "Service worker no disponible." };
  }
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return { ok: true, message: "No había suscripción activa en este dispositivo." };
  }
  const endpoint = subscription.endpoint;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ endpoint }),
  });
  await subscription.unsubscribe();
  return { ok: true, message: "Notificaciones desactivadas en este dispositivo." };
}
