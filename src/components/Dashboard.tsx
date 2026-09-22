"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { getRiverHeight, getForecast, getHistoricalTideData, getTideReadingsMinMax, type RiverHeightData, type HistoricalTideData, type TideReadingsMinMax } from "@/app/actions/riverHeight";
import { getWeather } from "@/app/actions/weather";
import { getWindForecast } from "@/app/actions/windForecast";
import { type WeatherData } from "@/types/weather";
import type { WindForecastSlot } from "@/types/windForecast";
import { type ForecastData } from "@/types/forecast";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { useAuth } from "@/hooks/useAuth";
import { getStatusFromHeight } from "@/utils/alertThresholds";
import { subscribeToWebPush } from "@/utils/webPush";
import RiverHeightDisplay from "@/components/RiverHeightDisplay";
import WeatherCard from "@/components/WeatherCard";
import AlertLevelsModal from "@/components/AlertLevelsModal";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

interface DashboardProps {
    initialRiverData?: RiverHeightData[] | null;
    initialForecast?: ForecastData | null;
    initialHistoricalData?: HistoricalTideData | null;
    initialWeatherData?: WeatherData | null;
    initialTideReadingsMinMax?: TideReadingsMinMax | null;
    initialWindForecast?: WindForecastSlot[];
}

export default function Dashboard({ 
    initialRiverData,
    initialForecast,
    initialHistoricalData,
    initialWeatherData,
    initialTideReadingsMinMax,
    initialWindForecast = [],
}: DashboardProps) {
    const {
        thresholds,
        refresh: refreshAuth,
        isAdmin,
        isLoggedIn,
        windAlerts,
        windDefaults,
    } = useAuth();

    const [riverData, setRiverData] = useState<RiverHeightData | null>(initialRiverData?.[0] || null);
    const riverDataRef = useRef<RiverHeightData | null>(initialRiverData?.[0] || null);
    
    useEffect(() => {
        riverDataRef.current = riverData;
    }, [riverData]);
    
    const [forecast, setForecast] = useState<ForecastData | null>(initialForecast || null);
    const [historicalData, setHistoricalData] = useState<HistoricalTideData | null>(initialHistoricalData || null);
    const [weatherData, setWeatherData] = useState<WeatherData | null>(initialWeatherData || null);
    const [windForecast, setWindForecast] = useState<WindForecastSlot[]>(initialWindForecast);
    const [tideReadingsMinMax, setTideReadingsMinMax] = useState<TideReadingsMinMax | null>(initialTideReadingsMinMax || null);
    
    const [loading, setLoading] = useState(!initialRiverData);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [timeSinceUpdate, setTimeSinceUpdate] = useState<number>(0);
    const [formattedTimestamp, setFormattedTimestamp] = useState<string>("");
    
    const [, startTransition] = useTransition();
    const [isMounted, setIsMounted] = useState(false);
    const isVisible = usePageVisibility();
    
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const previousHeightRef = useRef<number | null>(initialRiverData?.[1]?.height || null);
    const thresholdsRef = useRef(thresholds);

    useEffect(() => {
        thresholdsRef.current = thresholds;
    }, [thresholds]);

    const fetchData = async () => {
        startTransition(async () => {
            try {
                setError(null);
                const [riverDataArray, forecastData, historicalTideData, currentWeatherData, minMaxData, windForecastData] = await Promise.all([
                    getRiverHeight(),
                    getForecast(),
                    getHistoricalTideData(),
                    getWeather(),
                    getTideReadingsMinMax(),
                    getWindForecast(),
                ]);
                
                if (!riverDataArray || riverDataArray.length === 0) {
                    throw new Error("No se encontraron datos del río");
                }
                
                const latestRiverData = riverDataArray[0];
                const secondLatestRiverData = riverDataArray.length > 1 ? riverDataArray[1] : null;

                const configuredStatus = getStatusFromHeight(
                    latestRiverData.height,
                    thresholdsRef.current
                );
                const updatedRiverData = {
                    ...latestRiverData,
                    status: configuredStatus,
                };

                setRiverData(updatedRiverData);
                riverDataRef.current = updatedRiverData;
                setForecast(forecastData);
                setHistoricalData(historicalTideData);
                setWeatherData(currentWeatherData);
                setWindForecast(windForecastData);
                setTideReadingsMinMax(minMaxData);
                
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

    useEffect(() => {
        if (!isMounted) return;

        const scrollSections = new Set(["clima", "mareas"]);

        const scrollToSection = (sectionId: string) => {
            document.getElementById(sectionId)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
            if (sectionId === "clima") {
                window.dispatchEvent(new CustomEvent("openWindForecastOverlay"));
            }
        };

        const scrollIfHash = () => {
            const sectionId = window.location.hash.replace("#", "");
            if (scrollSections.has(sectionId)) {
                window.setTimeout(() => scrollToSection(sectionId), 150);
            }
        };

        scrollIfHash();

        const onHashChange = () => scrollIfHash();

        const onServiceWorkerMessage = (event: MessageEvent) => {
            const msg = event.data;
            if (msg?.type !== "alerta-scroll" || typeof msg.section !== "string") return;
            if (!scrollSections.has(msg.section)) return;
            const hash = `#${msg.section}`;
            if (window.location.hash !== hash) {
                window.history.replaceState(null, "", hash);
            }
            window.setTimeout(() => scrollToSection(msg.section), 150);
        };

        window.addEventListener("hashchange", onHashChange);
        navigator.serviceWorker?.addEventListener("message", onServiceWorkerMessage);

        return () => {
            window.removeEventListener("hashchange", onHashChange);
            navigator.serviceWorker?.removeEventListener("message", onServiceWorkerMessage);
        };
    }, [isMounted]);

    useEffect(() => {
        setIsMounted(true);
        if ("serviceWorker" in navigator) {
            subscribeToWebPush().catch(() => {});
        }
        if (!initialRiverData) {
            fetchData();
        }
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        if (riverData) {
            const configuredStatus = getStatusFromHeight(riverData.height, thresholds);
            if (configuredStatus !== riverData.status) {
                const updatedData = { ...riverData, status: configuredStatus };
                setRiverData(updatedData);
                riverDataRef.current = updatedData;
            }
        }
    }, [isMounted, thresholds, riverData?.height]);

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

    useEffect(() => {
        const handleThresholdUpdate = () => {
            refreshAuth();
            if (riverDataRef.current) {
                const newStatus = getStatusFromHeight(
                    riverDataRef.current.height,
                    thresholdsRef.current
                );
                const updatedData = { ...riverDataRef.current, status: newStatus };
                setRiverData(updatedData);
                riverDataRef.current = updatedData;
            }
        };

        window.addEventListener("thresholdsUpdated", handleThresholdUpdate);
        return () => window.removeEventListener("thresholdsUpdated", handleThresholdUpdate);
    }, [refreshAuth]);

    useEffect(() => {
        const handleWindAlertsUpdate = () => {
            refreshAuth();
            getWindForecast().then(setWindForecast).catch(() => {});
        };
        window.addEventListener("windAlertsUpdated", handleWindAlertsUpdate);
        return () =>
            window.removeEventListener("windAlertsUpdated", handleWindAlertsUpdate);
    }, [refreshAuth]);

    useEffect(() => {
        if (!isMounted || !lastUpdate) return;
        const today = new Date();
        if (lastUpdate.getDate() === today.getDate() && lastUpdate.getMonth() === today.getMonth() && lastUpdate.getFullYear() === today.getFullYear()) {
            setFormattedTimestamp(lastUpdate.toLocaleString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "America/Argentina/Buenos_Aires",
            }));
        } else {
            setFormattedTimestamp(lastUpdate.toLocaleString("es-AR", {
                weekday: "short",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "America/Argentina/Buenos_Aires",
            }));
        }
    }, [isMounted, lastUpdate]);

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
                <header className="text-center mb-6 relative">
                    <div className="relative z-10 flex items-center justify-end gap-1 mb-1 sm:mb-0 sm:absolute sm:top-0 sm:right-0">
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                                aria-label="Administración"
                                title="Administración"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                    />
                                </svg>
                            </Link>
                        )}
                        <Link
                            href="/config"
                            className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                            aria-label="Configuración"
                            title="Configuración"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        </Link>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <img src="/icon-source.png" alt="Wave icon" className="w-9 h-9 sm:w-10 sm:h-10 inline-block" />
                        Alerta Sudestada
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                        Monitoreo en tiempo real de la altura del río con alertas de inundación
                    </p>
                    
                    <div className="flex flex-col items-center gap-2 mb-4">
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
                        tideReadingsMinMax={tideReadingsMinMax}
                        loading={loading}
                        previousHeight={previousHeightRef.current}
                    />
                    
                    <section
                        id="clima"
                        className="scroll-mt-6"
                        aria-label="Clima y pronóstico de viento"
                    >
                        <WeatherCard
                            data={weatherData}
                            windForecast={windForecast}
                            windSpeedThresholds={
                                isLoggedIn ? windAlerts.speedKmh : windDefaults.speedKmh
                            }
                        />
                    </section>

                    <div className="w-full max-w-2xl mx-auto">
                        <a style={{ marginLeft: 'auto', marginRight: 'auto', width: '192px', display: 'block' }} href='https://cafecito.app/brew-o-matic' rel='noopener' target='_blank'>
                            <img srcSet='https://cdn.cafecito.app/imgs/buttons/button_6.png 1x, https://cdn.cafecito.app/imgs/buttons/button_6_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_6_3.75x.png 3.75x' src='https://cdn.cafecito.app/imgs/buttons/button_6.png' alt='Invitame un café en cafecito.app' />
                        </a>
                    </div>
                </div>

                <footer className="mt-12 text-center text-sm text-gray-500">
                    <p>Actualización automática cada 30 segundos</p>
                    <p className="mt-2">Instalá la app y permití notificaciones para alertas push del servidor</p>
                </footer>
            </main>

            <AlertLevelsModal />
            <PWAInstallPrompt />
        </div>
    );
}
