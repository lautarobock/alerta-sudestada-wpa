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
      "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"
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
                <defs>
                  {/* Arrowhead marker definition */}
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
                
                {/* Outer circle */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#cbd5e1" 
                  strokeWidth="1.5"
                />
                
                {/* Inner circle */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="35" 
                  fill="none" 
                  stroke="#e2e8f0" 
                  strokeWidth="1"
                />
                
                {/* Radial lines for 16 directions */}
                {Array.from({ length: 16 }, (_, i) => {
                  const angle = i * 22.5;
                  const isCardinal = i % 4 === 0;
                  const isIntercardinal = i % 2 === 0;
                  const length = isCardinal ? 10 : isIntercardinal ? 7 : 5;
                  const x1 = 50 + 35 * Math.cos((angle - 90) * Math.PI / 180);
                  const y1 = 50 + 35 * Math.sin((angle - 90) * Math.PI / 180);
                  const x2 = 50 + (35 + length) * Math.cos((angle - 90) * Math.PI / 180);
                  const y2 = 50 + (35 + length) * Math.sin((angle - 90) * Math.PI / 180);
                  
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
                
                {/* Cardinal direction markers (N, E, S, O) */}
                <text x="50" y="12" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">N</text>
                <text x="88" y="55" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">E</text>
                <text x="50" y="93" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">S</text>
                <text x="12" y="55" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">O</text>
                
                {/* Intercardinal direction markers (NE, SE, SW, NO) */}
                <text x="75" y="25" textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">NE</text>
                <text x="75" y="85" textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">SE</text>
                <text x="25" y="85" textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">SO</text>
                <text x="25" y="25" textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">NO</text>
                
                {/* Center point */}
                <circle cx="50" cy="50" r="3" fill="#3b82f6" />
                
                {/* Wind direction arrow - points in direction wind is going TO */}
                <g transform={`rotate(${wind.deg + 180} 50 50)`}>
                  <line 
                    x1="50" 
                    y1="50" 
                    x2="50" 
                    y2="12" 
                    stroke="#3b82f6" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
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

