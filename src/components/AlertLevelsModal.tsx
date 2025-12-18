"use client";

import { useEffect, useState } from "react";
import { getAlertThresholds } from "@/utils/alertThresholds";

interface AlertThreshold {
  level: string;
  height: number;
  description: string;
  color: string;
}

const colorClasses = {
  green: "bg-green-100 border-green-300 text-green-800",
  yellow: "bg-yellow-100 border-yellow-300 text-yellow-800",
  orange: "bg-orange-100 border-orange-300 text-orange-800",
  red: "bg-red-100 border-red-300 text-red-800",
};

export default function AlertLevelsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [thresholds, setThresholds] = useState(() => getAlertThresholds());

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };

    const handleThresholdUpdate = () => {
      setThresholds(getAlertThresholds());
    };

    window.addEventListener('openAlertLevelsModal', handleOpen);
    window.addEventListener('thresholdsUpdated', handleThresholdUpdate);
    
    return () => {
      window.removeEventListener('openAlertLevelsModal', handleOpen);
      window.removeEventListener('thresholdsUpdated', handleThresholdUpdate);
    };
  }, []);

  const THRESHOLDS: AlertThreshold[] = [
    {
      level: "Normal",
      height: 0,
      description: "Nivel de río dentro de parámetros normales",
      color: "green",
    },
    {
      level: "Advertencia",
      height: thresholds.warning,
      description: "El nivel del río está aumentando. Monitorear de cerca.",
      color: "yellow",
    },
    {
      level: "Alerta",
      height: thresholds.alert,
      description: "Nivel elevado. Posible riesgo de inundación en zonas bajas.",
      color: "orange",
    },
    {
      level: "Crítico",
      height: thresholds.critical,
      description: "Nivel crítico. Evacuación recomendada en zonas de riesgo.",
      color: "red",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Niveles de Alerta</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors text-2xl font-bold leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 space-y-3">
          {THRESHOLDS.map((threshold) => (
            <div
              key={threshold.level}
              className={`p-4 rounded-lg border-2 ${colorClasses[threshold.color as keyof typeof colorClasses]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{threshold.level}</h3>
                <span className="font-mono font-bold">
                  {threshold.height > 0 
                    ? `≥ ${threshold.height.toFixed(1)}m` 
                    : `< ${thresholds.warning.toFixed(1)}m`}
                </span>
              </div>
              <p className="text-sm opacity-90">{threshold.description}</p>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📱 Notificaciones</h3>
            <p className="text-sm text-blue-800">
              Esta aplicación se actualiza automáticamente cada 30 segundos. 
              En caso de alerta o nivel crítico, recibirás notificaciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

