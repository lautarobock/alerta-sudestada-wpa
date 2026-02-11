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

export interface TideReadingExtreme {
    value: number;
    moment: Date;
}

export type TimeFilter = '1month' | '6months' | 'year' | 'historic';

export interface TideReadingsMinMax {
    min: TideReadingExtreme | null;
    max: TideReadingExtreme | null;
    /** Number of distinct periods where the curve was above 3m (counts upward crossings) */
    periodsAbove3mCount: number;
    /** First reading date (only set when timeFilter is 'historic') */
    firstReadingDate?: Date | null;
}

// Thresholds for alerts (in meters)
const THRESHOLDS = {
    normal: 0,
    warning: 2.5,
    alert: 3.0,
    critical: 3.5
};

function getStatus(height: number): RiverHeightData["status"] {
    if (height >= THRESHOLDS.critical) return "critical";
    if (height >= THRESHOLDS.alert) return "alert";
    if (height >= THRESHOLDS.warning) return "warning";
    return "normal";
}

export async function getRiverHeight(): Promise<RiverHeightData[] | null> {
    try {
        const client = await clientPromise;
        const db = client.db('alerta-sudestada');
        // Query the tides collection
        const collection = db.collection('tides');
        // Get the two most recent readings by moment (Date)
        // Document structure: { moment: Date, reading: number, astronomical: number }
        const latestReadings = await collection
            .find({ type: "reading" }, { sort: { moment: -1 } })
            .limit(2)
            .toArray();
        
        
        if (!latestReadings || latestReadings.length === 0) {
            return null;
        }
        
        return latestReadings.map(latestReading => {
            const height = latestReading.value ?? 0;
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
        });
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

/** Historical min and max from tides collection, only type 'reading'. */
export async function getTideReadingsMinMax(timeFilter: TimeFilter = 'historic'): Promise<TideReadingsMinMax | null> {
    try {
        const client = await clientPromise;
        const db = client.db('alerta-sudestada');
        const collection = db.collection('tides');

        // Calculate date filter based on timeFilter
        let dateFilter: { $gte?: Date } = {};
        const now = new Date();
        
        if (timeFilter === '1month') {
            dateFilter.$gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (timeFilter === '6months') {
            dateFilter.$gte = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        } else if (timeFilter === 'year') {
            dateFilter.$gte = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        }
        // 'historic' means no date filter

        const queryFilter: any = { type: 'reading' };
        if (dateFilter.$gte) {
            queryFilter.moment = dateFilter;
        }

        const allReadings = await collection.find(
            queryFilter,
            { sort: { moment: 1 }, projection: { value: 1, moment: 1 } }
        ).toArray() as { value?: number; moment?: Date }[];

        if (!allReadings || allReadings.length === 0) {
            return null;
        }

        // Filter readings to ensure they have valid values
        const validReadings = allReadings.filter(r => r.value != null && r.moment != null);
        
        if (validReadings.length === 0) {
            return null;
        }

        // Find min and max from filtered readings
        let minDoc: { value: number; moment: Date } | null = null;
        let maxDoc: { value: number; moment: Date } | null = null;

        for (const reading of validReadings) {
            const value = reading.value!;
            const moment = reading.moment instanceof Date ? reading.moment : new Date(reading.moment!);
            
            if (!minDoc || value < minDoc.value) {
                minDoc = { value, moment };
            }
            if (!maxDoc || value > maxDoc.value) {
                maxDoc = { value, moment };
            }
        }

        const toExtreme = (doc: { value: number; moment: Date } | null): TideReadingExtreme | null => {
            if (!doc) return null;
            return {
                value: doc.value,
                moment: doc.moment,
            };
        };

        const min = toExtreme(minDoc);
        const max = toExtreme(maxDoc);
        if (!min && !max) return null;

        // Count periods above 3m: count upward crossings (from <=3m to >3m)
        let periodsAbove3mCount = 0;
        let wasBelowOrEqual3m = true; // Start assuming we're below/equal to 3m
        
        for (const reading of validReadings) {
            const value = reading.value!;
            const isAbove3m = value > 3;
            
            // Count transition from <=3m to >3m (upward crossing)
            if (wasBelowOrEqual3m && isAbove3m) {
                periodsAbove3mCount++;
            }
            
            wasBelowOrEqual3m = !isAbove3m;
        }

        // Get first reading date when using historic filter
        let firstReadingDate: Date | null = null;
        if (timeFilter === 'historic' && validReadings.length > 0) {
            const firstReading = validReadings[0];
            if (firstReading.moment) {
                firstReadingDate = firstReading.moment instanceof Date 
                    ? firstReading.moment 
                    : new Date(firstReading.moment);
            }
        }

        return { min, max, periodsAbove3mCount, firstReadingDate };
    } catch (error) {
        console.error('Error fetching tide readings min/max from MongoDB:', error);
        return null;
    }
}

