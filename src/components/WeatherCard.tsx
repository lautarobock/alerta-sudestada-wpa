"use client";

import { useCallback, useEffect, useState } from "react";
import { windDirectionLabel, windSpeedKmh, formatWindSlotDate } from "@/lib/windDirection";
import {
  DEFAULT_WIND_SPEED_KMH,
  getWindSpeedStatus,
  type WindSpeedKmhThresholds,
} from "@/lib/windAlerts";
import { WeatherData } from "@/types/weather";
import type { WindForecastSlot } from "@/types/windForecast";
import { OverlayIconButton, OverlayModal } from "@/components/OverlayModal";

type WeatherOverlay = "wind" | "details" | null;

interface WeatherCardProps {
  data: WeatherData | null;
  windForecast?: WindForecastSlot[];
  windSpeedThresholds?: WindSpeedKmhThresholds;
}

function WindCompass({ deg, markerId = "wind-arrow" }: { deg: number; markerId?: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="2.5"
          orient="auto"
        >
          <polygon points="0 0, 8 2.5, 0 5" fill="#3b82f6" />
        </marker>
      </defs>

      <circle cx="50" cy="50" r="45" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="#e2e8f0" strokeWidth="1" />

      {Array.from({ length: 16 }, (_, i) => {
        const angle = i * 22.5;
        const isCardinal = i % 4 === 0;
        const isIntercardinal = i % 2 === 0;
        const length = isCardinal ? 10 : isIntercardinal ? 7 : 5;
        const x1 = 50 + 35 * Math.cos(((angle - 90) * Math.PI) / 180);
        const y1 = 50 + 35 * Math.sin(((angle - 90) * Math.PI) / 180);
        const x2 = 50 + (35 + length) * Math.cos(((angle - 90) * Math.PI) / 180);
        const y2 = 50 + (35 + length) * Math.sin(((angle - 90) * Math.PI) / 180);

        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isCardinal ? "#94a3b8" : "#cbd5e1"}
            strokeWidth={isCardinal ? "1.5" : "1"}
          />
        );
      })}

      <text x="50" y="12" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">N</text>
      <text x="88" y="55" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">E</text>
      <text x="50" y="93" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">S</text>
      <text x="12" y="55" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">O</text>
      <text x="75" y="25" textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">NE</text>
      <text x="75" y="85" textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">SE</text>
      <text x="25" y="85" textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">SO</text>
      <text x="25" y="25" textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">NO</text>

      <circle cx="50" cy="50" r="3" fill="#3b82f6" />

      <g transform={`rotate(${deg} 50 50)`}>
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="12"
          stroke="#3b82f6"
          strokeWidth="3.5"
          strokeLinecap="round"
          markerEnd={`url(#${markerId})`}
        />
      </g>
    </svg>
  );
}

function WindForecastList({
  windForecast,
  windSpeedThresholds,
}: {
  windForecast: WindForecastSlot[];
  windSpeedThresholds: WindSpeedKmhThresholds;
}) {
  if (windForecast.length === 0) {
    return (
      <p className="p-4 bg-green-50 rounded-lg border border-green-200 text-green-800 text-sm">
        No hay alertas de viento en los próximos 5 días según el
        pronóstico disponible (bloques de 3 h).
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {windForecast.map((slot) => {
        const kmh = windSpeedKmh(slot.speed);
        const status = getWindSpeedStatus(kmh, windSpeedThresholds);
        const isCritical = status === "critical";
        return (
          <div
            key={slot.dt.toISOString()}
            className={`p-4 rounded-lg border ${
              isCritical
                ? "bg-red-50 border-red-200"
                : "bg-orange-50 border-orange-200"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p
                  className={`font-semibold ${
                    isCritical ? "text-red-900" : "text-orange-900"
                  }`}
                >
                  {windDirectionLabel(slot.deg)} · {kmh} km/h
                  <span className="ml-2 text-xs uppercase tracking-wide">
                    {isCritical ? "Crítico" : "Alerta"}
                  </span>
                </p>
                <p
                  className={`text-sm mt-1 capitalize ${
                    isCritical ? "text-red-700" : "text-orange-700"
                  }`}
                >
                  {formatWindSlotDate(slot.dt)}
                </p>
              </div>
              {slot.gust !== undefined && (
                <p
                  className={`text-sm whitespace-nowrap ${
                    isCritical ? "text-red-800" : "text-orange-800"
                  }`}
                >
                  Ráfagas ~{windSpeedKmh(slot.gust)} km/h
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function WeatherCard({
  data,
  windForecast = [],
  windSpeedThresholds = DEFAULT_WIND_SPEED_KMH,
}: WeatherCardProps) {
  const [overlay, setOverlay] = useState<WeatherOverlay>(null);
  const closeOverlay = useCallback(() => setOverlay(null), []);

  useEffect(() => {
    const openWind = () => setOverlay("wind");
    window.addEventListener("openWindForecastOverlay", openWind);
    if (window.location.hash === "#clima") {
      openWind();
    }
    return () => window.removeEventListener("openWindForecastOverlay", openWind);
  }, []);

  if (!data) return null;

  const { main, weather, wind, rain } = data;
  const currentCondition = weather[0];
  const iconUrl = `https://openweathermap.org/img/wn/${currentCondition.icon}@2x.png`;
  const currentDir = windDirectionLabel(wind.deg);
  const currentKmh = Math.round(wind.speed * 3.6);

  const nextAlert = windForecast[0] ?? null;
  const hasCriticalAlert = windForecast.some(
    (slot) => getWindSpeedStatus(windSpeedKmh(slot.speed), windSpeedThresholds) === "critical"
  );
  const windBadge = nextAlert ? (hasCriticalAlert ? "critical" : "alert") : null;
  const nextAlertCritical =
    nextAlert
      ? getWindSpeedStatus(windSpeedKmh(nextAlert.speed), windSpeedThresholds) === "critical"
      : false;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="p-6 bg-white rounded-xl border-2 border-blue-200 shadow-lg">
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>🌦️</span> Clima Actual
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <OverlayIconButton
              label="Detalle del clima"
              onClick={() => setOverlay("details")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3.25C12 3.25 6.75 9.4 6.75 13.5a5.25 5.25 0 1010.5 0C17.25 9.4 12 3.25 12 3.25z" />
              </svg>
            </OverlayIconButton>
            <OverlayIconButton
              label="Pronóstico de viento"
              badge={windBadge}
              onClick={() => setOverlay("wind")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8h11a2.5 2.5 0 100-5 2.5 2.5 0 00-1.5.5M3 12h14a3 3 0 110 6H9M3 16h6" />
              </svg>
            </OverlayIconButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={iconUrl}
              alt={currentCondition.description}
              className="w-20 h-20 bg-blue-50 rounded-full"
            />
            <div>
              <div className="text-4xl font-bold text-gray-900">
                {Math.round(main.temp)}°C
              </div>
              <p className="text-gray-600 capitalize">
                {currentCondition.description}
              </p>
              <p className="text-sm text-gray-500">
                ST: {Math.round(main.feels_like)}°C
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 min-w-[7.5rem]">
            <div className="relative w-24 h-24">
              <WindCompass deg={wind.deg} />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{currentDir}</p>
              <p className="text-sm text-gray-600">{currentKmh} km/h</p>
            </div>
          </div>
        </div>

        {nextAlert && (
          <button
            type="button"
            onClick={() => setOverlay("wind")}
            className={`mt-5 w-full text-left p-3 rounded-lg border transition-colors ${
              nextAlertCritical
                ? "bg-red-50 border-red-200 hover:bg-red-100"
                : "bg-orange-50 border-orange-200 hover:bg-orange-100"
            }`}
          >
            <p
              className={`font-semibold ${
                nextAlertCritical ? "text-red-900" : "text-orange-900"
              }`}
            >
              Alerta de viento · {windDirectionLabel(nextAlert.deg)} ·{" "}
              {windSpeedKmh(nextAlert.speed)} km/h
              {nextAlertCritical && (
                <span className="ml-2 text-xs uppercase tracking-wide">Crítico</span>
              )}
            </p>
            <p
              className={`text-sm mt-1 capitalize ${
                nextAlertCritical ? "text-red-700" : "text-orange-700"
              }`}
            >
              {formatWindSlotDate(nextAlert.dt)}
            </p>
          </button>
        )}
      </div>

      {overlay === "details" && (
        <OverlayModal title="Detalle del clima" onClose={closeOverlay}>
          <div className="space-y-3 text-gray-600">
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span className="flex items-center gap-2">
                <span>💧</span> Humedad
              </span>
              <span className="font-medium">{main.humidity}%</span>
            </div>
            {rain && (rain["1h"] || rain["3h"]) && (
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                <span className="flex items-center gap-2">
                  <span>☔</span> Lluvia
                </span>
                <span className="font-medium">
                  {rain["1h"] || rain["3h"] || 0} mm
                </span>
              </div>
            )}
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span>Min</span>
              <span className="font-medium">{Math.round(main.temp_min)}°C</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span>Max</span>
              <span className="font-medium">{Math.round(main.temp_max)}°C</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span>Presión</span>
              <span className="font-medium">{main.pressure} hPa</span>
            </div>
          </div>
        </OverlayModal>
      )}

      {overlay === "wind" && (
        <OverlayModal title="Pronóstico de viento" onClose={closeOverlay}>
          <WindForecastList
            windForecast={windForecast}
            windSpeedThresholds={windSpeedThresholds}
          />
        </OverlayModal>
      )}
    </div>
  );
}
