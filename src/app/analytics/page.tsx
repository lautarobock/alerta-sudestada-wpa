'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';

type Range = '7d' | '30d' | '90d' | '1y' | 'all';
type GroupBy = 'day' | 'week' | 'month';
type Kind = 'all' | 'pageview' | 'event';

interface AnalyticsData {
  range: Range;
  groupBy: GroupBy;
  totalEvents: number;
  uniqueSessions: number;
  newSessions: number;
  eventViews: Array<{ _id: { path: string; eventName?: string }; count: number }>;
  series: Array<{
    date: string;
    events: number;
    uniqueSessions: number;
    newSessions: number;
  }>;
  paths: string[];
}

const RANGE_OPTIONS: Array<{ value: Range; label: string }> = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: '1y', label: 'Último año' },
  { value: 'all', label: 'Todo' },
];

const GROUP_OPTIONS: Array<{ value: GroupBy; label: string }> = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

const KIND_OPTIONS: Array<{ value: Kind; label: string }> = [
  { value: 'all', label: 'Todo' },
  { value: 'pageview', label: 'Solo páginas' },
  { value: 'event', label: 'Solo eventos' },
];

const SUGGESTED_GROUP: Record<Range, GroupBy> = {
  '7d': 'day',
  '30d': 'day',
  '90d': 'week',
  '1y': 'week',
  all: 'month',
};

const GROUP_TITLE: Record<GroupBy, string> = {
  day: 'por día',
  week: 'por semana',
  month: 'por mes',
};

const selectClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-800';

function periodDate(isoDay: string): Date {
  return new Date(`${isoDay}T12:00:00-03:00`);
}

function formatAxisLabel(isoDay: string, groupBy: GroupBy): string {
  const date = periodDate(isoDay);
  if (groupBy === 'month') {
    return date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
  }
  if (groupBy === 'week') {
    return `Sem ${date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`;
  }
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function formatFullLabel(isoDay: string, groupBy: GroupBy): string {
  const date = periodDate(isoDay);
  if (groupBy === 'month') {
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  }
  if (groupBy === 'week') {
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    const startLabel = date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
    });
    const endLabel = end.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `Semana del ${startLabel} al ${endLabel}`;
  }
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function AnalyticsDashboard() {
  const { loading: authLoading, isAdmin, isLoggedIn } = useAuth();
  const [range, setRange] = useState<Range>('90d');
  const [groupBy, setGroupBy] = useState<GroupBy>('week');
  const [kind, setKind] = useState<Kind>('all');
  const [path, setPath] = useState('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ range, groupBy, kind });
    if (path) params.set('path', path);

    if (!hasLoadedRef.current) setLoading(true);
    else setRefreshing(true);
    setError(null);

    let cancelled = false;
    fetch(`/api/analytics?${params.toString()}`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json() as Promise<AnalyticsData>;
      })
      .then((data) => {
        if (!cancelled) {
          hasLoadedRef.current = true;
          setAnalyticsData(data);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error al cargar');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAdmin, range, groupBy, kind, path]);

  const chartData = useMemo(() => {
    if (!analyticsData) return [];
    return analyticsData.series.map((point) => ({
      ...point,
      dateFormatted: formatAxisLabel(point.date, analyticsData.groupBy),
    }));
  }, [analyticsData]);

  const handleRangeChange = (next: Range) => {
    setRange(next);
    setGroupBy(SUGGESTED_GROUP[next]);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-700">Cargando analíticas...</p>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Acceso restringido</h1>
          <p className="text-gray-600 mb-6">Las analíticas son solo para administradores.</p>
          <Link
            href={isLoggedIn ? '/' : '/config'}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg"
          >
            {isLoggedIn ? 'Volver al inicio' : 'Iniciar sesión'}
          </Link>
        </div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">Error al cargar las analíticas: {error}</p>
      </div>
    );
  }

  const groupByLabel = GROUP_TITLE[analyticsData?.groupBy ?? groupBy];
  const showDots = chartData.length <= 16;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Analíticas Anónimas</h1>
          <Link href="/admin" className="text-sm text-blue-700 hover:text-blue-900 underline">
            Administración
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <label className="text-sm text-gray-600">
            Período
            <select
              className={`${selectClass} mt-1`}
              value={range}
              onChange={(e) => handleRangeChange(e.target.value as Range)}
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Agrupar
            <select
              className={`${selectClass} mt-1`}
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            >
              {GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Tipo
            <select
              className={`${selectClass} mt-1`}
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
            >
              {KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Ruta
            <select
              className={`${selectClass} mt-1`}
              value={path}
              onChange={(e) => setPath(e.target.value)}
            >
              <option value="">Todas</option>
              {analyticsData?.paths.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ${refreshing ? 'opacity-60' : ''}`}>
          <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-blue-800">Eventos</h2>
            <p className="text-3xl font-bold text-blue-600">{analyticsData?.totalEvents ?? 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-green-800">Sesiones únicas</h2>
            <p className="text-3xl font-bold text-green-600">{analyticsData?.uniqueSessions ?? 0}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-amber-800">Nuevas sesiones</h2>
            <p className="text-3xl font-bold text-amber-600">{analyticsData?.newSessions ?? 0}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Métricas {groupByLabel}
            {refreshing && (
              <span className="ml-2 text-sm font-normal text-gray-500">Actualizando…</span>
            )}
          </h2>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            {chartData.length === 0 ? (
              <p className="text-gray-600">No hay datos para este filtro.</p>
            ) : (
              <div className="space-y-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="dateFormatted"
                        stroke="#6b7280"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px',
                        }}
                        labelFormatter={(_value, payload) => {
                          const point = payload?.[0]?.payload;
                          if (!point?.date) return String(_value);
                          return formatFullLabel(point.date, analyticsData?.groupBy ?? groupBy);
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="events"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Eventos"
                        dot={showDots ? { r: 4 } : false}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="uniqueSessions"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Sesiones activas"
                        dot={showDots ? { r: 4 } : false}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="newSessions"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Nuevas sesiones"
                        dot={showDots ? { r: 4 } : false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    Detalle {groupByLabel}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Período</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Eventos</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Sesiones activas</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Nuevas sesiones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((point) => (
                          <tr key={point.date} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-700">
                              {formatFullLabel(point.date, analyticsData?.groupBy ?? groupBy)}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-blue-600">
                              {point.events}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-green-600">
                              {point.uniqueSessions}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-amber-600">
                              {point.newSessions}
                            </td>
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
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Eventos y páginas más visitadas
          </h2>
          <ul className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            {analyticsData?.eventViews.map((eventView) => (
              <li
                key={`${eventView._id.path}-${eventView._id.eventName || 'pageview'}`}
                className="flex justify-between items-center py-2 border-b last:border-b-0 border-gray-100"
              >
                <span className="text-gray-700 font-medium break-all">
                  {eventView._id.eventName
                    ? `Evento: ${eventView._id.eventName} (ruta: ${eventView._id.path})`
                    : `Página: ${eventView._id.path}`}
                </span>
                <span className="text-gray-600 text-lg font-semibold">{eventView.count}</span>
              </li>
            ))}
          </ul>
          {analyticsData?.eventViews.length === 0 && (
            <p className="text-gray-600 mt-4">No hay datos de eventos para este filtro.</p>
          )}
        </div>
      </div>
    </div>
  );
}
