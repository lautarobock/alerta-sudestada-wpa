"use client";

import { WeatherData } from "@/types/weather";

interface WeatherCardProps {
  data: WeatherData | null;
}

export default function WeatherCard({ data }: WeatherCardProps) {
  if (!data) return null;

  const { main, weather, wind, rain } = data;
  const currentCondition = weather[0];
  const iconUrl = `https://openweathermap.org/img/wn/${currentCondition.icon}@2x.png`;

  // Helper to format wind direction
  const getWindDirection = (deg: number) => {
    const directions = [
      "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
      "S", "SSW", "SW", "WSW", "O", "ONO", "NO", "NNO"
    ];
    return directions[Math.round(deg / 22.5) % 16];
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="p-6 bg-white rounded-xl border-2 border-blue-200 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🌦️</span> Clima Actual
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {/* Temperature Section */}
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

          {/* Wind Direction Section */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative w-24 h-24">
              <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full"
              >
                {/* Outer circle */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#e0e7ff" 
                  strokeWidth="2"
                />
                {/* Cardinal direction markers */}
                <text x="50" y="15" textAnchor="middle" fontSize="14" fill="#3b82f6" fontWeight="bold">N</text>
                <text x="85" y="55" textAnchor="middle" fontSize="14" fill="#3b82f6" fontWeight="bold">E</text>
                <text x="50" y="90" textAnchor="middle" fontSize="14" fill="#3b82f6" fontWeight="bold">S</text>
                <text x="15" y="55" textAnchor="middle" fontSize="14" fill="#3b82f6" fontWeight="bold">O</text>
                {/* Center point */}
                <circle cx="50" cy="50" r="4" fill="#3b82f6" />
                {/* Wind direction arrow - points in direction wind is coming FROM (meteorological convention) */}
                <g transform={`rotate(${wind.deg} 50 50)`}>
                  <line 
                    x1="50" 
                    y1="50" 
                    x2="50" 
                    y2="15" 
                    stroke="#3b82f6" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
                {/* Arrowhead marker definition */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="8"
                    refX="4"
                    refY="2.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 8 2.5, 0 5"
                      fill="#3b82f6"
                    />
                  </marker>
                </defs>
              </svg>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {getWindDirection(wind.deg)}
              </div>
              <p className="text-sm text-gray-600">
                {Math.round(wind.speed * 3.6)} km/h
              </p>
            </div>
          </div>

          {/* Details Section */}
          <div className="col-span-2 md:col-span-1 space-y-3 text-gray-600">
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span className="flex items-center gap-2">
                <span>💨</span> Viento
              </span>
              <span className="font-medium">
                {Math.round(wind.speed * 3.6)} km/h {getWindDirection(wind.deg)}
              </span>
            </div>

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
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-500">
            <div>
                Min: {Math.round(main.temp_min)}°C
            </div>
            <div>
                Max: {Math.round(main.temp_max)}°C
            </div>
            <div>
                Presión: {main.pressure} hPa
            </div>
        </div>
      </div>
    </div>
  );
}

