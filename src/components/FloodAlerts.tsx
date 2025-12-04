"use client";

interface AlertThreshold {
  level: string;
  height: number;
  description: string;
  color: string;
}

const THRESHOLDS: AlertThreshold[] = [
  {
    level: "Normal",
    height: 0,
    description: "Nivel de río dentro de parámetros normales",
    color: "green",
  },
  {
    level: "Advertencia",
    height: 2.5,
    description: "El nivel del río está aumentando. Monitorear de cerca.",
    color: "yellow",
  },
  {
    level: "Alerta",
    height: 3.0,
    description: "Nivel elevado. Posible riesgo de inundación en zonas bajas.",
    color: "orange",
  },
  {
    level: "Crítico",
    height: 3.5,
    description: "Nivel crítico. Evacuación recomendada en zonas de riesgo.",
    color: "red",
  },
];

const colorClasses = {
  green: "bg-green-100 border-green-300 text-green-800",
  yellow: "bg-yellow-100 border-yellow-300 text-yellow-800",
  orange: "bg-orange-100 border-orange-300 text-orange-800",
  red: "bg-red-100 border-red-300 text-red-800",
};

export default function FloodAlerts() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Niveles de Alerta</h2>
      <div className="space-y-3">
        {THRESHOLDS.map((threshold, index) => (
          <div
            key={threshold.level}
            className={`p-4 rounded-lg border-2 ${colorClasses[threshold.color as keyof typeof colorClasses]}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{threshold.level}</h3>
              <span className="font-mono font-bold">
                {threshold.height > 0 ? `≥ ${threshold.height}m` : "< 2.5m"}
              </span>
            </div>
            <p className="text-sm opacity-90">{threshold.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">📱 Notificaciones</h3>
        <p className="text-sm text-blue-800">
          Esta aplicación se actualiza automáticamente cada 30 segundos. 
          En caso de alerta o nivel crítico, recibirás notificaciones.
        </p>
      </div>
    </div>
  );
}

