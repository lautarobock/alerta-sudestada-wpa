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
    
    // Get page and event views by path and eventName
    const eventViews = await collection.aggregate([
      {
        $group: {
          _id: { path: '$path', eventName: '$eventName' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 20, // Increased limit to show more events
      },
    ]).toArray();

    return NextResponse.json({
      totalEvents,
      uniqueSessions,
      eventViews,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

