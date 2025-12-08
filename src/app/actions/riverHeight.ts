'use server';

import clientPromise from '@/lib/mongodb';
import type { ForecastData, Forecast, ForecastType } from '@/types/forecast';

export interface RiverHeightData {
    height: number;
    unit: string;
    timestamp: string;
    location: string;
    status: "normal" | "warning" | "alert" | "critical";
}

export interface TideDataPoint {
    moment: Date;
    reading: number | undefined;
    astronomical: number | undefined;
}

export interface HistoricalTideData {
    data: TideDataPoint[];
}

// Thresholds for alerts (in meters)
const THRESHOLDS = {
    normal: 0,
    warning: 0.5,
    alert: 0.8,
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

export async function getForecast(): Promise<ForecastData | null> {
    try {
        const client = await clientPromise;
        const db = client.db('alerta-sudestada');
        const collection = db.collection('forecast');
        
        // Get the most recent forecast by moment (Date)
        const latestForecast = await collection
            .findOne({}, { sort: { moment: -1 } });
        
        if (!latestForecast) {
            return null;
        }
        
        // Convert the forecast data, ensuring dates are properly converted
        const values: Forecast[] = (latestForecast.values || []).map((f: any) => ({
            date: f.date instanceof Date ? f.date : new Date(f.date),
            mode: f.mode as ForecastType,
            value: f.value
        }));
        
        return {
            moment: latestForecast.moment instanceof Date 
                ? latestForecast.moment 
                : new Date(latestForecast.moment),
            values
        };
    } catch (error) {
        console.error('Error fetching forecast from MongoDB:', error);
        return null;
    }
}

export async function getHistoricalTideData(daysAgo: number = 1): Promise<HistoricalTideData | null> {
    try {
        const client = await clientPromise;
        const db = client.db('alerta-sudestada');
        const collection = db.collection('tides');
        
        // Fetch historical tide data for both types
        // Document structure: { moment: Date, type: 'reading' | 'astronomical', value: number }
        console.log('days ago', new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000));
        const tideDocuments = await collection
            .find({ moment: { $gte: new Date(new Date().getTime() - daysAgo * 24 * 60 * 60 * 1000) } }, { sort: { moment: -1 } }) // Get more to account for both types
            .toArray();
        
        if (!tideDocuments || tideDocuments.length === 0) {
            return null;
        }
        
        // Group documents by moment and merge reading/astronomical values
        const dataMap = new Map<string, TideDataPoint>();
        
        for (const doc of tideDocuments) {
            const moment = doc.moment instanceof Date ? doc.moment : new Date(doc.moment);
            const momentKey = moment.toISOString();
            
            if (!dataMap.has(momentKey)) {
                dataMap.set(momentKey, {
                    moment,
                    reading: undefined,
                    astronomical: undefined
                });
            }
            
            const dataPoint = dataMap.get(momentKey)!;
            
            if (doc.type === 'reading') {
                dataPoint.reading = doc.value ?? undefined;
            } else if (doc.type === 'astronomical') {
                dataPoint.astronomical = doc.value ?? undefined;
            }
        }
        
        // Convert map to array and sort by moment ascending for chronological display
        const data: TideDataPoint[] = Array.from(dataMap.values())
            .sort((a, b) => a.moment.getTime() - b.moment.getTime());
        
        if (data.length === 0) {
            return null;
        }
        
        return { data };
    } catch (error) {
        console.error('Error fetching historical tide data from MongoDB:', error);
        return null;
    }
}

