"use client";

export default function FloodAlerts() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">📱 Notificaciones</h3>
        <p className="text-sm text-blue-800">
          Esta aplicación se actualiza automáticamente cada 30 segundos. 
          En caso de alerta o nivel crítico, recibirás notificaciones.
        </p>
      </div>
    </div>
  );
}

