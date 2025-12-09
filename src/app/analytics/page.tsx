'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  totalEvents: number;
  uniqueSessions: number;
  eventViews: Array<{ _id: { path: string; eventName?: string }; count: number }>;
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: AnalyticsData = await response.json();
        setAnalyticsData(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-700">Cargando analíticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">Error al cargar las analíticas: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Panel de Analíticas Anónimas</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-blue-800">Eventos Totales</h2>
            <p className="text-3xl font-bold text-blue-600">{analyticsData?.totalEvents}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-green-800">Sesiones Únicas</h2>
            <p className="text-3xl font-bold text-green-600">{analyticsData?.uniqueSessions}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-purple-800">Vistas de Página y Eventos</h2>
            <p className="text-3xl font-bold text-purple-600">{analyticsData?.eventViews.reduce((sum, pv) => sum + pv.count, 0)}</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Eventos y Páginas Más Visitadas</h2>
          <ul className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            {analyticsData?.eventViews.map((eventView) => (
              <li key={`${eventView._id.path}-${eventView._id.eventName || 'pageview'}`} className="flex justify-between items-center py-2 border-b last:border-b-0 border-gray-100">
                <span className="text-gray-700 font-medium break-all">
                  {eventView._id.eventName ? `Event: ${eventView._id.eventName} (Path: ${eventView._id.path})` : `Page: ${eventView._id.path}`}
                </span>
                <span className="text-gray-600 text-lg font-semibold">{eventView.count}</span>
              </li>
            ))}
          </ul>
          {analyticsData?.eventViews.length === 0 && (
            <p className="text-gray-600 mt-4">No hay datos de eventos disponibles.</p>
          )}
        </div>
      </div>
    </div>
  );
}
