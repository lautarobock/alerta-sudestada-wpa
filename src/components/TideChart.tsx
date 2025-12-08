"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TideDataPoint } from '@/app/actions/riverHeight';
import type { ForecastData, ForecastType } from '@/types/forecast';

interface TideChartProps {
    data: TideDataPoint[];
    forecast?: ForecastData | null;
}

interface ChartDataPoint {
    time: string;
    timestamp: number;
    reading?: number;
    astronomical?: number;
    forecast?: number;
    forecastMode?: ForecastType;
}

export default function TideChart({ data, forecast }: TideChartProps) {
    // Format data for Recharts
    const chartData: ChartDataPoint[] = data.map((point) => ({
        time: point.moment.toLocaleString("es-AR", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Argentina/Buenos_Aires",
        }),
        timestamp: point.moment.getTime(),
        reading: point.reading,
        astronomical: point.astronomical,
    }));

    // Format forecast data as individual points (only 2-3 values from most recent forecast)
    const forecastPoints: ChartDataPoint[] = forecast?.values?.slice(0, 3).map((f) => ({
        time: f.date.toLocaleString("es-AR", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Argentina/Buenos_Aires",
        }),
        timestamp: f.date.getTime(),
        forecast: f.value,
        forecastMode: f.mode,
    })) || [];

    // Merge forecast points into chart data
    const allData: ChartDataPoint[] = [...chartData];
    forecastPoints.forEach((forecastPoint) => {
        // Try to find a point at a similar time (within 1 hour)
        const existingPoint = allData.find(
            (point) => Math.abs(point.timestamp - forecastPoint.timestamp) < 60 * 60 * 1000
        );
        
        if (existingPoint) {
            // Add forecast to existing point
            existingPoint.forecast = forecastPoint.forecast;
            existingPoint.forecastMode = forecastPoint.forecastMode;
        } else {
            // Add as new point with only forecast data
            allData.push({
                ...forecastPoint,
                reading: undefined,
                astronomical: undefined,
            });
        }
    });

    // Sort by timestamp
    allData.sort((a, b) => a.timestamp - b.timestamp);

    if (chartData.length === 0) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
                No hay datos históricos disponibles
            </div>
        );
    }

    return (
        <div className="w-full h-80 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Histórico de Mareas</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={allData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                        dataKey="time" 
                        stroke="#6b7280"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                        label={{ value: 'Altura (m)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px'
                        }}
                        formatter={(value: any) => {
                            if (value === null || value === undefined || typeof value !== 'number') {
                                return null;
                            }
                            return [`${value.toFixed(2)} m`, ''];
                        }}
                    />
                    <Legend />
                    <Line 
                        type="monotone" 
                        dataKey="reading" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Lectura"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="astronomical" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Astronómica"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls={false}
                    />
                    {forecastPoints.length > 0 && (
                        <Line 
                            type="monotone" 
                            dataKey="forecast" 
                            stroke="transparent"
                            strokeWidth={0}
                            name="Pronóstico"
                            connectNulls={false}
                            dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                if (!payload?.forecast) return null;
                                const isHigh = payload.forecastMode === 'high';
                                return (
                                    <circle 
                                        cx={cx} 
                                        cy={cy} 
                                        r={6} 
                                        fill={isHigh ? "#f59e0b" : "#8b5cf6"} 
                                        stroke="#fff" 
                                        strokeWidth={2}
                                    />
                                );
                            }}
                            activeDot={{ r: 8 }}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
