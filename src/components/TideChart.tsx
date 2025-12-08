"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TideDataPoint } from '@/app/actions/riverHeight';

interface TideChartProps {
    data: TideDataPoint[];
}

export default function TideChart({ data }: TideChartProps) {
    // Format data for Recharts
    const chartData = data.map((point) => ({
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
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                        formatter={(value: number) => [`${value.toFixed(2)} m`, '']}
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
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
