"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { getRiverHeight, getForecast, getHistoricalTideData, type RiverHeightData, type HistoricalTideData } from "@/app/actions/riverHeight";
import { getWeather } from "@/app/actions/weather";
import { type WeatherData } from "@/types/weather";
import { type ForecastData } from "@/types/forecast";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { 
  registerPeriodicSync, 
  requestNotificationPermission, 
  showAlertNotification 
} from "@/utils/backgroundSync";
import RiverHeightDisplay from "@/components/RiverHeightDisplay";
import WeatherCard from "@/components/WeatherCard";
import FloodAlerts from "@/components/FloodAlerts";
import AlertLevelsModal from "@/components/AlertLevelsModal";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import FloodReportForm from "@/components/FloodReportForm";

interface DashboardProps {
    initialRiverData?: RiverHeightData[] | null;
    initialForecast?: ForecastData | null;
    initialHistoricalData?: HistoricalTideData | null;
    initialWeatherData?: WeatherData | null;
}

export default function Dashboard({ 
    initialRiverData,
    initialForecast,
    initialHistoricalData,
    initialWeatherData
}: DashboardProps) {
    const [riverData, setRiverData] = useState<RiverHeightData | null>(initialRiverData?.[0] || null);
    const [forecast, setForecast] = useState<ForecastData | null>(initialForecast || null);
    const [historicalData, setHistoricalData] = useState<HistoricalTideData | null>(initialHistoricalData || null);
    const [weatherData, setWeatherData] = useState<WeatherData | null>(initialWeatherData || null);
    
    const [loading, setLoading] = useState(!initialRiverData);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(initialRiverData?.[0]?.timestamp ? new Date(initialRiverData[0].timestamp) : null);
    const [timeSinceUpdate, setTimeSinceUpdate] = useState<number>(0);
    const [formattedTimestamp, setFormattedTimestamp] = useState<string>("");
    
    const [isPending, startTransition] = useTransition();
    const [isMounted, setIsMounted] = useState(false);
    const isVisible = usePageVisibility();
    
    const previousStatusRef = useRef<RiverHeightData["status"] | null>(initialRiverData?.[0]?.status || null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const previousHeightRef = useRef<number | null>(initialRiverData?.[1]?.height || null);

    const fetchData = async () => {
        startTransition(async () => {
            try {
                setError(null);
                const [riverDataArray, forecastData, historicalTideData, currentWeatherData] = await Promise.all([
                    getRiverHeight(),
                    getForecast(),
                    getHistoricalTideData(),
                    getWeather()
                ]);
                
                if (!riverDataArray || riverDataArray.length === 0) {
                    throw new Error("No se encontraron datos del río");
                }
                
                const latestRiverData = riverDataArray[0];
                const secondLatestRiverData = riverDataArray.length > 1 ? riverDataArray[1] : null;

                // Check if status changed to alert/critical and show notification
                if (previousStatusRef.current && 
                    previousStatusRef.current !== latestRiverData.status &&
                    (latestRiverData.status === "alert" || latestRiverData.status === "critical")) {
                    const statusLabels = {
                        alert: "Alerta",
                        critical: "Crítico",
                        warning: "Advertencia",
                        normal: "Normal"
                    };
                    await showAlertNotification(
                        `🚨 ${statusLabels[latestRiverData.status]} - Río Luján`,
                        `El nivel del río ha alcanzado ${latestRiverData.height}m. Estado: ${statusLabels[latestRiverData.status]}`,
                        { height: latestRiverData.height, status: latestRiverData.status }
                    );
                }
                
                previousStatusRef.current = latestRiverData.status;
                setRiverData(latestRiverData);
                setForecast(forecastData);
                setHistoricalData(historicalTideData);
                setWeatherData(currentWeatherData);
                
                const now = new Date();
                setLastUpdate(now);
                setTimeSinceUpdate(0);
                previousHeightRef.current = secondLatestRiverData?.height || null;
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
        requestNotificationPermission();
        if ("serviceWorker" in navigator) {
            registerPeriodicSync();
        }
        // If no initial data, fetch
        if (!initialRiverData) {
            fetchData();
        }
    }, []);

    // Handle visibility changes
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (isVisible) {
            fetchData();
            intervalRef.current = setInterval(fetchData, 30000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isVisible]);

    // Update formatted timestamp
    useEffect(() => {
        if (!isMounted || !lastUpdate) return;
        
        setFormattedTimestamp(lastUpdate.toLocaleString("es-AR", {
            weekday: "long",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "America/Argentina/Buenos_Aires",
        }));
    }, [isMounted, lastUpdate]);

    // Update time since update counter
    useEffect(() => {
        if (!isMounted || !lastUpdate) return;

        const updateCounter = () => {
            setTimeSinceUpdate(Math.floor((Date.now() - lastUpdate.getTime()) / 1000));
        };

        updateCounter();
        const interval = setInterval(updateCounter, 1000);
        return () => clearInterval(interval);
    }, [isMounted, lastUpdate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <header className="text-center mb-6">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <img src="/icon-source.png" alt="Wave icon" className="w-10 h-10 inline-block" />
                        Alerta Sudestada
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                        Monitoreo en tiempo real de la altura del río con alertas de inundación
                    </p>
                    
                    {/* Refresh Control */}
                    <div className="flex flex-col items-center gap-2 mb-4">
                        <button
                            onClick={fetchData}
                            disabled={isPending}
                            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-sm disabled:opacity-70"
                            aria-label="Actualizar datos"
                        >
                            <span className={`inline-block ${isPending ? "animate-spin" : ""}`}>🔄</span>
                            <span>{isPending ? "ACTUALIZANDO..." : "ACTUALIZAR AHORA"}</span>
                        </button>
                        <div className="text-sm text-gray-500">
                            Última actualización: <span className="font-medium text-gray-800">{isMounted ? formattedTimestamp : "Cargando..."}</span>
                            {isMounted && (
                                <span className="ml-1 text-gray-400">
                                    (hace {timeSinceUpdate}s)
                                </span>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="space-y-8">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                            <p className="text-red-700">Error: {error}</p>
                            <button
                                onClick={fetchData}
                                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    <RiverHeightDisplay
                        data={riverData}
                        forecast={forecast}
                        historicalData={historicalData}
                        loading={loading}
                        previousHeight={previousHeightRef.current}
                    />
                    
                    <WeatherCard data={weatherData} />
                    <FloodAlerts />
                    <FloodReportForm />

                    <div className="w-full max-w-2xl mx-auto">
                        <a style={{ marginLeft: 'auto', marginRight: 'auto', width: '192px', display: 'block' }} href='https://cafecito.app/brew-o-matic' rel='noopener' target='_blank'>
                            <img srcSet='https://cdn.cafecito.app/imgs/buttons/button_6.png 1x, https://cdn.cafecito.app/imgs/buttons/button_6_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_6_3.75x.png 3.75x' src='https://cdn.cafecito.app/imgs/buttons/button_6.png' alt='Invitame un café en cafecito.app' />
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-12 text-center text-sm text-gray-500">
                    <p>Actualización automática cada 30 segundos</p>
                    <p className="mt-2">Instala esta app en tu dispositivo para recibir notificaciones</p>
                </footer>
            </main>

            <AlertLevelsModal />
            <PWAInstallPrompt />
        </div>
    );
}

