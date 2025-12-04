"use client";

import { useEffect, useState } from "react";

interface RiverHeightData {
  height: number;
  unit: string;
  timestamp: string;
  location: string;
  status: "normal" | "warning" | "alert" | "critical";
}

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

export default function RiverHeightDisplay() {
  const [data, setData] = useState<RiverHeightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setError(null);
      const response = await fetch("/api/river-height");
      if (!response.ok) throw new Error("Failed to fetch data");
      const riverData = await response.json();
      setData(riverData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

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
  const updateTime = new Date(data.timestamp).toLocaleString("es-AR");

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
          <span className="font-medium text-gray-800">{updateTime}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">Actualizado hace:</span>
          <span className="font-medium text-gray-800">
            {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s
          </span>
        </div>
        <button
          onClick={fetchData}
          className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Actualizar ahora
        </button>
      </div>
    </div>
  );
}

