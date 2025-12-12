'use client';

import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  totalEvents: number;
  uniqueSessions: number;
  eventViews: Array<{ _id: { path: string; eventName?: string }; count: number }>;
  eventsByDay: Array<{ date: string; count: number }>;
  uniqueSessionsByDay: Array<{ date: string; count: number }>;
  newSessionsByDay: Array<{ date: string; count: number }>;
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

  // Combine all three datasets into a single array
  // This must be called before any conditional returns to maintain hook order
  const combinedData = useMemo(() => {
    if (!analyticsData) return [];

    // Get all unique dates from all three arrays
    const allDates = new Set<string>();
    analyticsData.eventsByDay?.forEach(d => allDates.add(d.date));
    analyticsData.uniqueSessionsByDay?.forEach(d => allDates.add(d.date));
    analyticsData.newSessionsByDay?.forEach(d => allDates.add(d.date));

    // Create a map for quick lookup
    const eventsMap = new Map(analyticsData.eventsByDay?.map(d => [d.date, d.count]) || []);
    const uniqueSessionsMap = new Map(analyticsData.uniqueSessionsByDay?.map(d => [d.date, d.count]) || []);
    const newSessionsMap = new Map(analyticsData.newSessionsByDay?.map(d => [d.date, d.count]) || []);

    // Combine into single array
    return Array.from(allDates)
      .sort()
      .map(date => ({
        date,
        dateFormatted: new Date(date).toLocaleDateString('es-AR', { 
          month: 'short', 
          day: 'numeric' 
        }),
        events: eventsMap.get(date) || 0,
        uniqueSessions: uniqueSessionsMap.get(date) || 0,
        newSessions: newSessionsMap.get(date) || 0,
      }));
  }, [analyticsData]);

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

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Métricas Diarias</h2>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            {combinedData.length === 0 ? (
              <p className="text-gray-600">No hay datos disponibles.</p>
            ) : (
              <div className="space-y-6">
                {/* Chart visualization using recharts */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="dateFormatted" 
                        stroke="#6b7280"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px'
                        }}
                        labelFormatter={(value, payload) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return new Date(data.date).toLocaleDateString('es-AR', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            });
                          }
                          return value;
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="events" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Eventos"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="uniqueSessions" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Sesiones Activas"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="newSessions" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="Nuevas Sesiones"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Combined table view */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Detalle por Día</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Fecha</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Eventos</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Sesiones Activas</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Nuevas Sesiones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {combinedData.map((dayData) => (
                          <tr key={dayData.date} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-700">
                              {new Date(dayData.date).toLocaleDateString('es-AR', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-blue-600">{dayData.events}</td>
                            <td className="py-2 px-3 text-right font-semibold text-green-600">{dayData.uniqueSessions}</td>
                            <td className="py-2 px-3 text-right font-semibold text-amber-600">{dayData.newSessions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
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
