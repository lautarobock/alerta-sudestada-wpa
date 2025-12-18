"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAlertThresholds, setAlertThresholds, resetAlertThresholds, type AlertThresholds } from "@/utils/alertThresholds";
import ThresholdSlider from "@/components/ThresholdSlider";

export default function ConfigPage() {
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    warning: 2.5,
    alert: 3.0,
    critical: 3.5,
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load thresholds from localStorage
    const saved = getAlertThresholds();
    setThresholds(saved);
  }, []);

  const handleThresholdChange = (newThresholds: AlertThresholds) => {
    setThresholds(newThresholds);
    setIsSaved(false);
  };

  const handleSave = () => {
    try {
      setAlertThresholds(thresholds);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Error saving thresholds:", error);
      alert("Error al guardar la configuración. Por favor, verifica los valores.");
    }
  };

  const handleReset = () => {
    const defaultThresholds = resetAlertThresholds();
    setThresholds(defaultThresholds);
    setIsSaved(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Configuración</h1>
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors text-2xl font-bold leading-none px-3 py-1"
              aria-label="Volver"
            >
              ×
            </Link>
          </div>
          <p className="text-gray-600">
            Configura los límites de alerta para el nivel del río. Arrastra los puntos en el slider
            para ajustar los valores.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Límites de Alerta
          </h2>

          <ThresholdSlider
            min={0}
            max={5}
            step={0.1}
            values={thresholds}
            onChange={handleThresholdChange}
            labels={{
              warning: "Advertencia",
              alert: "Alerta",
              critical: "Crítico",
            }}
          />

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              {isSaved ? "✓ Guardado" : "Guardar Cambios"}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Restablecer
            </button>
          </div>

          {isSaved && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-lg text-sm">
              ✓ Configuración guardada exitosamente
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Los valores se guardan en tu navegador (localStorage)</li>
            <li>• Los cambios afectarán las notificaciones y el estado de las alertas</li>
            <li>• Asegúrate de que los valores estén en orden creciente</li>
            <li>• Los valores se miden en metros (m)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
