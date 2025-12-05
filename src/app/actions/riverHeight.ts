'use server';

import clientPromise from '@/lib/mongodb';

export interface RiverHeightData {
    height: number;
    unit: string;
    timestamp: string;
    location: string;
    status: "normal" | "warning" | "alert" | "critical";
}

// Thresholds for alerts (in meters)
const THRESHOLDS = {
    normal: 0,
    warning: 2.5,
    alert: 3.0,
    critical: 3.5,
};

function getStatus(height: number): RiverHeightData["status"] {
    if (height >= THRESHOLDS.critical) return "critical";
    if (height >= THRESHOLDS.alert) return "alert";
    if (height >= THRESHOLDS.warning) return "warning";
    return "normal";
}

export async function getRiverHeight(): Promise<RiverHeightData | null> {
    try {
        const client = await clientPromise;
        const db = client.db('alerta-sudestada');
        // Query the tides collection
        const collection = db.collection('tides');
        // Get the most recent reading by moment (Date)
        // Document structure: { moment: Date, reading: number, astronomical: number }
        const latestReading = await collection
            .findOne({ type: "reading" }, { sort: { moment: -1 } })
        
        
        if (!latestReading || latestReading.length === 0) {
            return null;
        }
        
        // Use the reading field (real height) for display
        const height = latestReading.value ?? 0;

        // Convert moment (Date) to ISO string
        const timestamp = latestReading.moment
            ? new Date(latestReading.moment).toISOString()
            : new Date().toISOString();

        return {
            height,
            unit: "m",
            timestamp,
            location: "San Fernando",
            status: getStatus(height),
        };
    } catch (error) {
        console.error('Error fetching river height from MongoDB:', error);
        return null;
    }
}

