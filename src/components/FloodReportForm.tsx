"use client";

import { useState, useEffect, FormEvent } from 'react';
import { submitFloodReport } from '@/app/actions/floodReport';
import { trackEvent } from '@/utils/analytics';
import type { FloodState } from '@/types/floodReport';

const FLOOD_STATES: { value: FloodState; label: string; description: string }[] = [
  { value: 'no-water', label: 'Sin agua', description: 'Puedes conducir normalmente' },
  { value: 'low-flood', label: 'Inundación baja', description: 'Hay agua pero puedes conducir' },
  { value: 'high-flood', label: 'Inundación alta', description: 'Hay tanta agua que no puedes conducir' },
  { value: 'evacuation', label: 'Evacuación', description: 'Nivel problemático de inundación' },
];

export default function FloodReportForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Form state
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string>('');
  const [state, setState] = useState<FloodState>('no-water');
  const [estimatedLevelCm, setEstimatedLevelCm] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('');
  const [reporterEmail, setReporterEmail] = useState<string>('');

  // Get current location on mount
  useEffect(() => {
    if (isOpen && !location) {
      getCurrentLocation();
    }
  }, [isOpen]);

  // Set current timestamp when opening
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimestamp(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [isOpen]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('La geolocalización no está disponible en tu navegador');
      // Default to San Fernando coordinates (based on the app context)
      setLocation({ latitude: -34.4417, longitude: -58.5631 });
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('No se pudo obtener tu ubicación. Puedes ingresarla manualmente.');
        // Default to San Fernando coordinates
        setLocation({ latitude: -34.4417, longitude: -58.5631 });
      }
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!location) {
      setSubmitStatus({ type: 'error', message: 'Por favor, ingresa una ubicación' });
      return;
    }

    if (!timestamp) {
      setSubmitStatus({ type: 'error', message: 'Por favor, ingresa una fecha y hora' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const result = await submitFloodReport({
        location,
        timestamp: new Date(timestamp).toISOString(),
        state,
        estimatedLevelCm: estimatedLevelCm ? parseFloat(estimatedLevelCm) : undefined,
        reporterName: reporterName || undefined,
        reporterEmail: reporterEmail || undefined,
      });

      if (result.success) {
        setSubmitStatus({ type: 'success', message: 'Reporte enviado exitosamente. ¡Gracias!' });
        // Reset form
        setState('no-water');
        setEstimatedLevelCm('');
        setReporterName('');
        setReporterEmail('');
        // Close modal after 2 seconds
        setTimeout(() => {
          setIsOpen(false);
          setSubmitStatus(null);
        }, 2000);
      } else {
        setSubmitStatus({ type: 'error', message: result.error || 'Error al enviar el reporte' });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitStatus({ type: 'error', message: 'Error al enviar el reporte. Por favor, intenta nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <button
        onClick={() => {
          setIsOpen(true);
          trackEvent('flood_report_modal_opened');
        }}
        className="w-full max-w-2xl mx-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
      >
        📍 Reportar Estado de Inundación
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reportar Estado de Inundación</h2>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setSubmitStatus(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación *
                  </label>
                  {locationError && (
                    <p className="text-sm text-yellow-600 mb-2">{locationError}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Latitud</label>
                      <input
                        type="number"
                        step="any"
                        value={location?.latitude ?? ''}
                        onChange={(e) =>
                          setLocation({
                            latitude: parseFloat(e.target.value) || 0,
                            longitude: location?.longitude ?? 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Longitud</label>
                      <input
                        type="number"
                        step="any"
                        value={location?.longitude ?? ''}
                        onChange={(e) =>
                          setLocation({
                            latitude: location?.latitude ?? 0,
                            longitude: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    📍 Usar mi ubicación actual
                  </button>
                </div>

                {/* Timestamp */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha y Hora *
                  </label>
                  <input
                    type="datetime-local"
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Flood State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado Actual *
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value as FloodState)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {FLOOD_STATES.map((floodState) => (
                      <option key={floodState.value} value={floodState.value}>
                        {floodState.label} - {floodState.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimated Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel Estimado sobre la Vereda (cm) <span className="text-gray-500">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={estimatedLevelCm}
                    onChange={(e) => setEstimatedLevelCm(e.target.value)}
                    placeholder="Ej: 15.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Reporter Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre <span className="text-gray-500">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Tu nombre (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Reporter Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-gray-500">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="tu@email.com (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Submit Status */}
                {submitStatus && (
                  <div
                    className={`p-4 rounded-md ${
                      submitStatus.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {submitStatus.message}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setSubmitStatus(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

