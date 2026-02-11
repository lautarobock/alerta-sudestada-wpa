"use client";

import { useState, useEffect } from "react";
import { getTideReadingsMinMax, type TideReadingsMinMax, type TimeFilter } from "@/app/actions/riverHeight";

interface HistoricalMinMaxBoxProps {
    initialData?: TideReadingsMinMax | null;
}

function formatMoment(d: Date): string {
    return d.toLocaleString("es-AR", {
        weekday: "short",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Argentina/Buenos_Aires",
    });
}

export default function HistoricalMinMaxBox({ initialData }: HistoricalMinMaxBoxProps) {
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('historic');
    const [data, setData] = useState<TideReadingsMinMax | null>(initialData || null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await getTideReadingsMinMax(timeFilter);
                setData(result);
            } catch (error) {
                console.error('Error fetching historical data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [timeFilter]);

    if (!data || (!data.min && !data.max && data.periodsAbove3mCount === 0)) {
        if (loading) {
            return (
                <div className="w-full max-w-2xl mx-auto">
                    <div className="p-6 bg-white rounded-xl border-2 border-slate-200 shadow-lg">
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    }

    const filterLabels: Record<TimeFilter, string> = {
        '1month': 'Último mes',
        '6months': '6 meses',
        'year': 'Año',
        'historic': 'Histórico'
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="p-6 bg-white rounded-xl border-2 border-slate-200 shadow-lg">
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span>📊</span> Histórico de lecturas
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(filterLabels) as TimeFilter[]).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setTimeFilter(filter)}
                                    disabled={loading}
                                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                                        timeFilter === filter
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {filterLabels[filter]}
                                </button>
                            ))}
                        </div>
                    </div>
                    {timeFilter === 'historic' && data.firstReadingDate && (
                        <p className="text-xs text-gray-500 mt-1">
                            Desde: {formatMoment(data.firstReadingDate)}
                        </p>
                    )}
                </div>
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {data.min && (
                            <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                                <p className="text-sm font-medium text-cyan-700 mb-1">Mínimo</p>
                                <p className="text-2xl font-bold text-cyan-900">
                                    {data.min.value.toFixed(2)} <span className="text-lg font-normal text-cyan-700">m</span>
                                </p>
                                <p className="text-xs text-cyan-600 mt-1">{formatMoment(data.min.moment)}</p>
                            </div>
                        )}
                        {data.max && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm font-medium text-blue-700 mb-1">Máximo</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {data.max.value.toFixed(2)} <span className="text-lg font-normal text-blue-700">m</span>
                                </p>
                                <p className="text-xs text-blue-600 mt-1">{formatMoment(data.max.moment)}</p>
                            </div>
                        )}
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm font-medium text-amber-700 mb-1">Períodos &gt; 3 m</p>
                            <p className="text-2xl font-bold text-amber-900">
                                {data.periodsAbove3mCount ?? 0}
                            </p>
                            <p className="text-xs text-amber-600 mt-1">veces que superó 3m</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
