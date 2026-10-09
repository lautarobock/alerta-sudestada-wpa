"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getFloodReportsForMap } from "@/app/actions/floodReport";
import { FLOOD_STATES } from "@/components/FloodReportForm";
import type { FloodReportMapPoint, FloodState } from "@/types/floodReport";

const SAN_FERNANDO: [number, number] = [-34.4417, -58.5631];

const STATE_COLORS: Record<FloodState, string> = {
    "no-water": "#22c55e",
    "low-flood": "#eab308",
    "high-flood": "#f97316",
    evacuation: "#ef4444",
};

const STATE_LABEL = Object.fromEntries(
    FLOOD_STATES.map((floodState) => [floodState.value, floodState.label])
) as Record<FloodState, string>;

function pinIcon(color: string) {
    return L.divIcon({
        className: "",
        iconSize: [28, 40],
        iconAnchor: [14, 40],
        popupAnchor: [0, -36],
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40" aria-hidden="true">
            <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
            <circle cx="14" cy="14" r="5" fill="#fff"/>
        </svg>`,
    });
}

const PIN_ICONS: Record<FloodState, L.DivIcon> = {
    "no-water": pinIcon(STATE_COLORS["no-water"]),
    "low-flood": pinIcon(STATE_COLORS["low-flood"]),
    "high-flood": pinIcon(STATE_COLORS["high-flood"]),
    evacuation: pinIcon(STATE_COLORS.evacuation),
};

function formatReportDate(timestamp: string) {
    return new Date(timestamp).toLocaleString("es-AR", {
        weekday: "long",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Argentina/Buenos_Aires",
    });
}

function FitReports({ points }: { points: FloodReportMapPoint[] }) {
    const map = useMap();

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            map.invalidateSize();
            if (points.length === 0) return;
            if (points.length === 1) {
                const point = points[0];
                map.setView([point.location.latitude, point.location.longitude], 15);
                return;
            }
            const bounds = L.latLngBounds(
                points.map((point) => [point.location.latitude, point.location.longitude] as [number, number])
            );
            map.fitBounds(bounds, { padding: [48, 48] });
        });
        return () => cancelAnimationFrame(frame);
    }, [map, points]);

    return null;
}

export default function FloodReportsMap() {
    const [reports, setReports] = useState<FloodReportMapPoint[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        getFloodReportsForMap()
            .then((points) => {
                if (!cancelled) setReports(points);
            })
            .catch(() => {
                if (!cancelled) setReports([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const points = useMemo(() => reports ?? [], [reports]);

    return (
        <div className="relative h-full w-full">
            <MapContainer
                center={SAN_FERNANDO}
                zoom={13}
                className="h-full w-full"
                scrollWheelZoom
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitReports points={points} />
                {points.map((point, index) => (
                    <Marker
                        key={`${point.timestamp}-${point.location.latitude}-${point.location.longitude}-${index}`}
                        position={[point.location.latitude, point.location.longitude]}
                        icon={PIN_ICONS[point.state]}
                    >
                        <Popup>
                            <div className="text-sm text-gray-800 min-w-[180px]">
                                <p className="font-semibold mb-1">{STATE_LABEL[point.state]}</p>
                                <p>Fecha: {formatReportDate(point.timestamp)}</p>
                                <p>
                                    Altura del río:{" "}
                                    {point.tideHeight != null ? `${point.tideHeight.toFixed(2)} m` : "—"}
                                </p>
                                <p>
                                    Sobre la vereda:{" "}
                                    {point.estimatedLevelCm != null ? `${point.estimatedLevelCm} cm` : "—"}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 rounded-lg shadow border border-gray-200 p-3 text-sm space-y-1.5">
                {FLOOD_STATES.map((floodState) => (
                    <div key={floodState.value} className="flex items-center gap-2 text-gray-800">
                        <span
                            className="h-3 w-3 rounded-full shrink-0 border border-white shadow"
                            style={{ backgroundColor: STATE_COLORS[floodState.value] }}
                            aria-hidden="true"
                        />
                        <span>{floodState.label}</span>
                    </div>
                ))}
            </div>

            {reports === null && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/70">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            )}

            {reports !== null && reports.length === 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 rounded-lg shadow border border-gray-200 px-4 py-2 text-sm text-gray-700">
                    No hay reportes de inundación
                </div>
            )}
        </div>
    );
}
