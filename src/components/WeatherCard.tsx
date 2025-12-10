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
    const directions = ["N", "NE", "E", "SE", "S", "SW", "O", "NO"];
    return directions[Math.round(deg / 45) % 8];
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="p-6 bg-white rounded-xl border-2 border-blue-200 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🌦️</span> Clima Actual
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Details Section */}
          <div className="space-y-3 text-gray-600">
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

