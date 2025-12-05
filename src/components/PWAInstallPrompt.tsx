"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useEffect, useState } from "react";

export default function PWAInstallPrompt() {
  const { isInstallable, install, dismiss } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInstallable) {
      // Small delay to ensure smooth animation
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isInstallable]);

  if (!isInstallable || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-slide-up">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-blue-200 p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📱</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1">
            Instalar Alerta Sudestada
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Instala la app para recibir alertas de inundación incluso cuando la app esté cerrada.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const installed = await install();
                if (installed) {
                  setIsVisible(false);
                }
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Instalar
            </button>
            <button
              onClick={() => {
                dismiss();
                setIsVisible(false);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm"
            >
              Ahora no
            </button>
          </div>
        </div>
        
        <button
          onClick={() => {
            dismiss();
            setIsVisible(false);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

