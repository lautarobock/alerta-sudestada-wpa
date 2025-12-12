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

    // Get events grouped by day
    const eventsByDay = await collection.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by date ascending
      },
    ]).toArray();

    // Get unique sessions grouped by day (all sessions active on that day)
    const uniqueSessionsByDay = await collection.aggregate([
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp',
              },
            },
            sessionId: '$sessionId',
          },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by date ascending
      },
    ]).toArray();

    // Get new sessions grouped by day (only count sessions that first appeared on that day)
    // This finds the first occurrence of each session and groups by the date of that first occurrence
    const newSessionsByDay = await collection.aggregate([
      {
        // First, find the earliest timestamp for each sessionId
        $group: {
          _id: '$sessionId',
          firstTimestamp: { $min: '$timestamp' },
        },
      },
      {
        // Convert the first timestamp to a date string
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$firstTimestamp',
            },
          },
        },
      },
      {
        // Group by date and count how many sessions first appeared on each day
        $group: {
          _id: '$date',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by date ascending
      },
    ]).toArray();

    return NextResponse.json({
      totalEvents,
      uniqueSessions,
      eventViews,
      eventsByDay: eventsByDay.map(item => ({
        date: item._id,
        count: item.count,
      })),
      uniqueSessionsByDay: uniqueSessionsByDay.map(item => ({
        date: item._id,
        count: item.count,
      })),
      newSessionsByDay: newSessionsByDay.map(item => ({
        date: item._id,
        count: item.count,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

