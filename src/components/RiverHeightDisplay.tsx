"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { getRiverHeight, type RiverHeightData } from "@/app/actions/riverHeight";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { 
  registerPeriodicSync, 
  requestNotificationPermission, 
  showAlertNotification 
} from "@/utils/backgroundSync";

const STATUS_CONFIG = {
    normal: {
        label: "Normal",
        color: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: "✓",
    },
    warning: {
        label: "Advertencia",
        color: "bg-yellow-500",
        textColor: "text-yellow-700",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        icon: "⚠",
    },
    alert: {
        label: "Alerta",
        color: "bg-orange-500",
        textColor: "text-orange-700",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        icon: "⚠",
    },
    critical: {
        label: "Crítico",
        color: "bg-red-500",
        textColor: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: "🚨",
    },
};

export default function RiverHeightDisplay({ initialData }: { initialData?: RiverHeightData | null }) {
    const [data, setData] = useState<RiverHeightData | null>(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(initialData?.timestamp ? new Date(initialData.timestamp) : null);
    const [timeSinceUpdate, setTimeSinceUpdate] = useState<number>(0);
    const [isPending, startTransition] = useTransition();
    const [isMounted, setIsMounted] = useState(false);
    const [formattedTimestamp, setFormattedTimestamp] = useState<string>("");
    const isVisible = usePageVisibility();
    const previousStatusRef = useRef<RiverHeightData["status"] | null>(initialData?.status || null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = async () => {
        startTransition(async () => {
            try {
                setError(null);
                const riverData = await getRiverHeight();
                if (!riverData) {
                    throw new Error("No se encontraron datos");
                }
                
                // Check if status changed to alert/critical and show notification
                if (previousStatusRef.current && 
                    previousStatusRef.current !== riverData.status &&
                    (riverData.status === "alert" || riverData.status === "critical")) {
                    const statusLabels = {
                        alert: "Alerta",
                        critical: "Crítico",
                        warning: "Advertencia",
                        normal: "Normal"
                    };
                    showAlertNotification(
                        `🚨 ${statusLabels[riverData.status]} - Río Luján`,
                        `El nivel del río ha alcanzado ${riverData.height}m. Estado: ${statusLabels[riverData.status]}`,
                        { height: riverData.height, status: riverData.status }
                    );
                }
                
                previousStatusRef.current = riverData.status;
                setData(riverData);
                const now = new Date();
                setLastUpdate(now);
                setTimeSinceUpdate(0);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido");
            } finally {
                setLoading(false);
            }
        });
    };

    // Initialize: request permissions and register background sync
    useEffect(() => {
        setIsMounted(true);
        
        // Request notification permission on mount
        requestNotificationPermission();
        
        // Register for periodic background sync
        if ("serviceWorker" in navigator) {
            registerPeriodicSync();
        }
        
        // Initial fetch
        fetchData();
    }, []);

    // Handle visibility changes: pause/resume interval and fetch when visible
    useEffect(() => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (isVisible) {
            // App is visible: fetch immediately and start interval
            fetchData();
            intervalRef.current = setInterval(fetchData, 30000);
        } else {
            // App is in background: interval will be paused
            // Background sync will handle updates via service worker
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isVisible]);

    // Update formatted timestamp when data changes (only on client)
    useEffect(() => {
        if (!isMounted || !data?.timestamp) return;
        
        const date = new Date(data.timestamp);
        setFormattedTimestamp(date.toLocaleString("es-AR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Argentina/Buenos_Aires",
        }));
    }, [isMounted, data?.timestamp]);

    // Update time since update counter every second (only on client)
    useEffect(() => {
        if (!isMounted || !lastUpdate) return;

        const updateCounter = () => {
            setTimeSinceUpdate(Math.floor((Date.now() - lastUpdate.getTime()) / 1000));
        };

        updateCounter();
        const interval = setInterval(updateCounter, 1000);
        return () => clearInterval(interval);
    }, [isMounted, lastUpdate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">Error: {error || "No se pudo cargar los datos"}</p>
                <button
                    onClick={fetchData}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    const config = STATUS_CONFIG[data.status];

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Status Card */}
            <div
                className={`p-6 rounded-xl border-2 ${config.borderColor} ${config.bgColor} shadow-lg`}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Estado del Río</h2>
                    <span className={`px-4 py-2 rounded-full ${config.color} text-white font-semibold flex items-center gap-2`}>
                        <span>{config.icon}</span>
                        {config.label}
                    </span>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Ubicación</p>
                    <p className="text-lg font-medium text-gray-800">{data.location}</p>
                </div>

                {/* Height Display */}
                <div className="mt-6">
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-bold text-gray-900">{data.height}</span>
                        <span className="text-2xl text-gray-600">{data.unit}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        Altura actual del río
                    </p>
                </div>

                {/* Visual Gauge */}
                <div className="mt-6">
                    <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                        <div
                            className={`h-full ${config.color} transition-all duration-500 flex items-center justify-end pr-2`}
                            style={{
                                width: `${Math.min(100, (data.height / 4) * 100)}%`,
                            }}
                        >
                            {data.height > 2 && (
                                <span className="text-white text-xs font-semibold">
                                    {data.height.toFixed(2)}m
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0m</span>
                        <span>2m</span>
                        <span>3m</span>
                        <span>4m+</span>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Última actualización:</span>
                    <span className="font-medium text-gray-800">
                        {isMounted ? formattedTimestamp : "Cargando..."}
                    </span>
                </div>
                {isMounted && (
                    <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-600">Actualizado hace:</span>
                        <span className="font-medium text-gray-800">
                            {timeSinceUpdate}s
                        </span>
                    </div>
                )}
                <button
                    onClick={fetchData}
                    disabled={isPending}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? "Actualizando..." : "Actualizar ahora"}
                </button>
            </div>
        </div>
    );
}

