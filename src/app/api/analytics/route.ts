import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { AnalyticsEvent } from '@/types/analytics';

export async function POST(request: NextRequest) {
  try {
    const event: AnalyticsEvent = await request.json();

    // Validate required fields
    if (!event.sessionId || !event.path || !event.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('alerta-sudestada');
    const collection = db.collection('analytics');

    // Insert the analytics event
    await collection.insertOne({
      ...event,
      timestamp: new Date(event.timestamp),
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to save analytics event' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve analytics (you can add authentication later)
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('alerta-sudestada');
    const collection = db.collection('analytics');

    // Get basic stats (you can expand this)
    const totalEvents = await collection.countDocuments();
    const uniqueSessions = await collection.distinct('sessionId').then(sessions => sessions.length);
    
    // Get page views by path
    const pageViews = await collection.aggregate([
      {
        $group: {
          _id: '$path',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]).toArray();

    return NextResponse.json({
      totalEvents,
      uniqueSessions,
      pageViews,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

