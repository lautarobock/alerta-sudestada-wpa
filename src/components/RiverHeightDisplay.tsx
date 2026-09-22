"use client";

import { useCallback, useEffect, useState } from "react";
import { ForecastType, type ForecastData } from "@/types/forecast";
import { type RiverHeightData, type HistoricalTideData, type TideReadingsMinMax } from "@/app/actions/riverHeight";
import TideChart from "@/components/TideChart";
import HistoricalMinMaxBox from "@/components/HistoricalMinMaxBox";
import { OverlayIconButton, OverlayModal } from "@/components/OverlayModal";
import FloodReportForm from "@/components/FloodReportForm";

type HistoryOverlay = "chart" | "readings" | null;

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

interface RiverHeightDisplayProps {
    data: RiverHeightData | null;
    forecast: ForecastData | null;
    historicalData: HistoricalTideData | null;
    tideReadingsMinMax?: TideReadingsMinMax | null;
    loading: boolean;
    previousHeight: number | null;
}

export default function RiverHeightDisplay({ 
    data,
    forecast,
    historicalData,
    tideReadingsMinMax,
    loading,
    previousHeight
}: RiverHeightDisplayProps) {
    const [formattedReadingTimestamp, setFormattedReadingTimestamp] = useState<string>("");
    const [timeSinceReading, setTimeSinceReading] = useState<number>(0);
    const [isMounted, setIsMounted] = useState(false);
    const [overlay, setOverlay] = useState<HistoryOverlay>(null);
    const closeOverlay = useCallback(() => setOverlay(null), []);

    const hasTideChart = Boolean(historicalData?.data?.length);

    // Update formatted reading timestamp when data changes
    useEffect(() => {
        setIsMounted(true);
        if (!data?.timestamp) return;
        
        const readingDate = new Date(data.timestamp);
        setFormattedReadingTimestamp(readingDate.toLocaleString("es-AR", {
            weekday: "long",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "America/Argentina/Buenos_Aires",
        }));
    }, [data?.timestamp]);

    // Update time since reading counter every second
    useEffect(() => {
        if (!isMounted || !data?.timestamp) return;

        const updateCounter = () => {
            const readingDate = new Date(data.timestamp);
            setTimeSinceReading(Math.floor((Date.now() - readingDate.getTime()) / 1000));
        };

        updateCounter();
        const interval = setInterval(updateCounter, 1000);
        return () => clearInterval(interval);
    }, [isMounted, data?.timestamp]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data) {
        return null; // Or some placeholder if data is missing but not loading (Dashboard handles error)
    }

    const config = STATUS_CONFIG[data.status];
    const highlightFloodReport = data.status !== "normal";

    function formatTimeSinceReading(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) {
            return `${days}d`;
        }
        if (hours > 0) {
            return `${hours}h`;
        }
        if (minutes > 0) {
            return `${minutes}m`;
        }
        return `${seconds}s`;
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Status Card */}
            <div
                className={`p-6 rounded-xl border-2 ${config.borderColor} ${config.bgColor} shadow-lg`}
            >
                <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">Estado del Río</h2>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {hasTideChart && (
                            <OverlayIconButton
                                label="Histórico de mareas"
                                onClick={() => setOverlay("chart")}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 15l4-4 3 3 6-8" />
                                </svg>
                            </OverlayIconButton>
                        )}
                        <OverlayIconButton
                            label="Histórico de lecturas"
                            onClick={() => setOverlay("readings")}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </OverlayIconButton>
                        {!highlightFloodReport && <FloodReportForm variant="icon" />}
                        <button
                            onClick={() => {
                                const event = new CustomEvent('openAlertLevelsModal');
                                window.dispatchEvent(event);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1.5 text-sm"
                            aria-label="Mostrar niveles de alerta"
                        >
                            <span>ℹ️</span>
                            <span>INFO</span>
                        </button>
                        <span className={`px-4 py-2 rounded-full ${config.color} text-white font-semibold flex items-center gap-2`}>
                            <span>{config.icon}</span>
                            {config.label}
                        </span>
                    </div>
                </div>

                <div className="mb-4 text-sm text-gray-500">
                    Lectura: <span className="font-medium text-gray-800">{isMounted ? formattedReadingTimestamp : "Cargando..."}</span>
                    {isMounted && (
                        <span className="ml-2 text-gray-400">
                            (hace {formatTimeSinceReading(timeSinceReading)})
                        </span>
                    )}
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
                        {previousHeight !== null && (
                            <span className="text-2xl" aria-label="Cambio en el nivel del río">
                                {data.height > previousHeight && "⬆️"}
                                {data.height < previousHeight && "⬇️"}
                                {data.height === previousHeight && "↔️"}
                            </span>
                        )}
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

                {highlightFloodReport && (
                    <FloodReportForm variant="banner" status={data.status} />
                )}
            </div>

            {/* Forecast Card */}
            {forecast && forecast.values && forecast.values.length > 0 && (() => {

                const formatFullDate = (date: Date) => {
                    return date.toLocaleString("es-AR", {
                        weekday: "long",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: "America/Argentina/Buenos_Aires",
                    });
                };

                // Sort forecasts by date
                const sortedForecasts = [...forecast.values].sort((a, b) => {
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                });
                
                return (
                    <div
                        id="mareas"
                        className="scroll-mt-6 p-6 bg-white rounded-xl border-2 border-blue-200 shadow-lg"
                    >
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Pronóstico de Mareas</h2>
                        <div className="space-y-3">
                            {sortedForecasts.map((forecastItem, index) => {
                                const isHigh = forecastItem.mode === ForecastType.HIGH;
                                const bgColor = isHigh ? "bg-blue-50" : "bg-cyan-50";
                                const borderColor = isHigh ? "border-blue-200" : "border-cyan-200";
                                const textColor = isHigh ? "text-blue-800" : "text-cyan-800";
                                const valueColor = isHigh ? "text-blue-900" : "text-cyan-900";
                                const unitColor = isHigh ? "text-blue-700" : "text-cyan-700";
                                const dateColor = isHigh ? "text-blue-600" : "text-cyan-600";
                                const icon = isHigh ? "📈" : "📉";
                                const label = isHigh ? "Pleamar" : "Bajamar";
                                
                                return (
                                    <div 
                                        key={index}
                                        className={`p-4 ${bgColor} rounded-lg border ${borderColor}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{icon}</span>
                                                <div>
                                                    <h3 className={`font-semibold ${textColor}`}>{label}</h3>
                                                    <p className={`text-sm ${dateColor} mt-1`}>
                                                        {formatFullDate(new Date(forecastItem.date))}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-2xl font-bold ${valueColor}`}>
                                                    {forecastItem.value.toFixed(2)}
                                                </span>
                                                <span className={`text-lg ${unitColor}`}>m</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {overlay === "chart" && historicalData?.data && (
                <OverlayModal
                    title="Histórico de Mareas"
                    wide
                    onClose={closeOverlay}
                >
                    <TideChart data={historicalData.data} forecast={forecast} embedded />
                </OverlayModal>
            )}

            {overlay === "readings" && (
                <OverlayModal
                    title="Histórico de lecturas"
                    onClose={closeOverlay}
                >
                    <HistoricalMinMaxBox initialData={tideReadingsMinMax} embedded />
                </OverlayModal>
            )}
        </div>
    );
}
