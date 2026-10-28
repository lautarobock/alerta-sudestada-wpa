'use server';

import clientPromise from '@/lib/mongodb';
import { getStatusFromHeight } from '@/lib/thresholds';
import { getDefaultThresholds } from '@/lib/thresholdsServer';
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

export async function getRiverHeight(): Promise<RiverHeightData[] | null> {
    try {
        const client = await clientPromise;
        const db = client.db('alerta-sudestada');
        const collection = db.collection('tides');
        const [latestReadings, thresholds] = await Promise.all([
            collection
                .find({ type: "reading" }, { sort: { moment: -1 } })
                .limit(2)
                .toArray(),
            getDefaultThresholds(),
        ]);

        if (!latestReadings || latestReadings.length === 0) {
            return null;
        }

        return latestReadings.map((latestReading) => {
            const height = latestReading.value ?? 0;
            const timestamp = latestReading.moment
                ? new Date(latestReading.moment).toISOString()
                : new Date().toISOString();
            return {
                height,
                unit: "m",
                timestamp,
                location: "San Fernando",
                status: getStatusFromHeight(height, thresholds),
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

type ExtremeDoc = { value: number; moment: Date };

/**
 * Min, max and upward crossings of 3 m, computed in Mongo.
 * The function only receives the summary, not the full readings history.
 */
export async function getTideReadingsMinMax(timeFilter: TimeFilter = 'historic'): Promise<TideReadingsMinMax | null> {
    try {
        const client = await clientPromise;
        const db = client.db('alerta-sudestada');
        const collection = db.collection('tides');

        const now = new Date();
        const moment: { $ne: null; $gte?: Date } = { $ne: null };
        if (timeFilter === '1month') {
            moment.$gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (timeFilter === '6months') {
            moment.$gte = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        } else if (timeFilter === 'year') {
            moment.$gte = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        }

        const [agg] = await collection.aggregate<{
            extremes: Array<{
                minDoc: ExtremeDoc | null;
                maxDoc: ExtremeDoc | null;
                firstMoment: Date | null;
            }>;
            crossings: Array<{ n: number }>;
        }>([
            {
                $match: {
                    type: 'reading',
                    value: { $type: 'number' },
                    moment,
                },
            },
            {
                $facet: {
                    extremes: [
                        {
                            $group: {
                                _id: null,
                                minDoc: {
                                    $top: {
                                        sortBy: { value: 1, moment: 1 },
                                        output: { value: '$value', moment: '$moment' },
                                    },
                                },
                                maxDoc: {
                                    $top: {
                                        sortBy: { value: -1, moment: 1 },
                                        output: { value: '$value', moment: '$moment' },
                                    },
                                },
                                firstMoment: { $min: '$moment' },
                            },
                        },
                    ],
                    crossings: [
                        { $sort: { moment: 1 } },
                        {
                            $setWindowFields: {
                                sortBy: { moment: 1 },
                                output: {
                                    prev: {
                                        $shift: { output: '$value', by: -1, default: null },
                                    },
                                },
                            },
                        },
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $gt: ['$value', 3] },
                                        {
                                            $or: [
                                                { $eq: ['$prev', null] },
                                                { $lte: ['$prev', 3] },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                        { $count: 'n' },
                    ],
                },
            },
        ], { allowDiskUse: true }).toArray();

        const extreme = agg?.extremes?.[0];
        if (!extreme?.minDoc && !extreme?.maxDoc) {
            return null;
        }

        const toExtreme = (doc: ExtremeDoc | null | undefined): TideReadingExtreme | null => {
            if (!doc || doc.value == null || doc.moment == null) return null;
            return {
                value: doc.value,
                moment: doc.moment instanceof Date ? doc.moment : new Date(doc.moment),
            };
        };

        const min = toExtreme(extreme?.minDoc);
        const max = toExtreme(extreme?.maxDoc);
        if (!min && !max) return null;

        const firstReadingDate = timeFilter === 'historic' && extreme?.firstMoment
            ? (extreme.firstMoment instanceof Date
                ? extreme.firstMoment
                : new Date(extreme.firstMoment))
            : null;

        return {
            min,
            max,
            periodsAbove3mCount: agg?.crossings?.[0]?.n ?? 0,
            firstReadingDate,
        };
    } catch (error) {
        console.error('Error fetching tide readings min/max from MongoDB:', error);
        return null;
    }
}

