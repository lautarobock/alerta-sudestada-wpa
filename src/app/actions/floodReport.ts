'use server';

import clientPromise from '@/lib/mongodb';
import type { FloodReport, FloodReportInput } from '@/types/floodReport';

/**
 * Find the tide reading nearest in time to the given timestamp
 */
async function getNearestTideReading(targetTimestamp: Date): Promise<{ height: number; timestamp: Date } | null> {
  try {
    const client = await clientPromise;
    const db = client.db('alerta-sudestada');
    const collection = db.collection('tides');

    // Find readings before and after the target timestamp
    const beforeReading = await collection
      .findOne(
        { 
          type: 'reading',
          moment: { $lte: targetTimestamp }
        },
        { sort: { moment: -1 } }
      );

    const afterReading = await collection
      .findOne(
        { 
          type: 'reading',
          moment: { $gte: targetTimestamp }
        },
        { sort: { moment: 1 } }
      );

    // If no readings found, return null
    if (!beforeReading && !afterReading) {
      return null;
    }

    // If only one reading found, use it
    if (!beforeReading && afterReading) {
      return {
        height: afterReading.value ?? 0,
        timestamp: afterReading.moment instanceof Date ? afterReading.moment : new Date(afterReading.moment),
      };
    }

    if (!afterReading && beforeReading) {
      return {
        height: beforeReading.value ?? 0,
        timestamp: beforeReading.moment instanceof Date ? beforeReading.moment : new Date(beforeReading.moment),
      };
    }

    // Both readings exist, find the closest one
    const beforeTime = beforeReading.moment instanceof Date 
      ? beforeReading.moment.getTime() 
      : new Date(beforeReading.moment).getTime();
    const afterTime = afterReading.moment instanceof Date 
      ? afterReading.moment.getTime() 
      : new Date(afterReading.moment).getTime();
    const targetTime = targetTimestamp.getTime();

    const beforeDiff = Math.abs(targetTime - beforeTime);
    const afterDiff = Math.abs(afterTime - targetTime);

    if (beforeDiff <= afterDiff) {
      return {
        height: beforeReading.value ?? 0,
        timestamp: beforeReading.moment instanceof Date ? beforeReading.moment : new Date(beforeReading.moment),
      };
    } else {
      return {
        height: afterReading.value ?? 0,
        timestamp: afterReading.moment instanceof Date ? afterReading.moment : new Date(afterReading.moment),
      };
    }
  } catch (error) {
    console.error('Error finding nearest tide reading:', error);
    return null;
  }
}

export async function submitFloodReport(input: FloodReportInput): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate required fields
    if (!input.location || typeof input.location.latitude !== 'number' || typeof input.location.longitude !== 'number') {
      return { success: false, error: 'Invalid location data' };
    }

    if (!input.state || !['no-water', 'low-flood', 'high-flood', 'evacuation'].includes(input.state)) {
      return { success: false, error: 'Invalid flood state' };
    }

    if (!input.timestamp) {
      return { success: false, error: 'Timestamp is required' };
    }

    // Validate latitude and longitude ranges
    if (input.location.latitude < -90 || input.location.latitude > 90) {
      return { success: false, error: 'Invalid latitude' };
    }

    if (input.location.longitude < -180 || input.location.longitude > 180) {
      return { success: false, error: 'Invalid longitude' };
    }

    const reportTimestamp = new Date(input.timestamp);
    
    // Find the nearest tide reading to the reported timestamp
    const nearestTide = await getNearestTideReading(reportTimestamp);

    const client = await clientPromise;
    const db = client.db('alerta-sudestada');
    const collection = db.collection('floodReports');

    // Insert the flood report
    await collection.insertOne({
      location: {
        latitude: input.location.latitude,
        longitude: input.location.longitude,
      },
      timestamp: reportTimestamp,
      state: input.state,
      estimatedLevelCm: input.estimatedLevelCm ?? null,
      reporterName: input.reporterName || null,
      reporterEmail: input.reporterEmail || null,
      tideHeight: nearestTide?.height ?? null,
      tideHeightTimestamp: nearestTide?.timestamp ?? null,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error submitting flood report:', error);
    return { success: false, error: 'Failed to submit flood report' };
  }
}

export async function getFloodReports(limit: number = 50): Promise<FloodReport[]> {
  try {
    const client = await clientPromise;
    const db = client.db('alerta-sudestada');
    const collection = db.collection('floodReports');

    const reports = await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return reports.map((doc) => ({
      _id: doc._id.toString(),
      location: {
        latitude: doc.location.latitude,
        longitude: doc.location.longitude,
      },
      timestamp: doc.timestamp instanceof Date ? doc.timestamp : new Date(doc.timestamp),
      state: doc.state,
      estimatedLevelCm: doc.estimatedLevelCm ?? undefined,
      reporterName: doc.reporterName ?? undefined,
      reporterEmail: doc.reporterEmail ?? undefined,
      tideHeight: doc.tideHeight ?? undefined,
      tideHeightTimestamp: doc.tideHeightTimestamp 
        ? (doc.tideHeightTimestamp instanceof Date ? doc.tideHeightTimestamp : new Date(doc.tideHeightTimestamp))
        : undefined,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
    }));
  } catch (error) {
    console.error('Error fetching flood reports:', error);
    return [];
  }
}

