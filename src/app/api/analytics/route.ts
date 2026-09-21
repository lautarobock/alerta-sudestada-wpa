import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { AnalyticsEvent } from '@/types/analytics';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function POST(request: NextRequest) {
  try {
    const event: AnalyticsEvent = await request.json();

    if (!event.sessionId || !event.path || !event.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('alerta-sudestada');
    const collection = db.collection('analytics');

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

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const range = parseRange(searchParams.get('range'));
    const groupBy = parseGroupBy(searchParams.get('groupBy'), range);
    const kind = parseKind(searchParams.get('kind'));
    const path = searchParams.get('path')?.trim() || '';

    const now = new Date();
    const from = rangeStart(range, now);

    const contentMatch: Record<string, unknown> = {};
    if (path) contentMatch.path = path;
    if (kind === 'pageview') {
      contentMatch.$or = [
        { eventName: { $exists: false } },
        { eventName: null },
        { eventName: '' },
      ];
    } else if (kind === 'event') {
      contentMatch.eventName = { $exists: true, $nin: [null, ''] };
    }

    const rangeMatch: Record<string, unknown> = { ...contentMatch };
    if (from) {
      rangeMatch.timestamp = { $gte: from, $lte: now };
    }

    const client = await clientPromise;
    const db = client.db('alerta-sudestada');
    const collection = db.collection('analytics');

    const [
      totalEvents,
      uniqueSessionIds,
      eventViews,
      eventsByBucket,
      uniqueSessionsByBucket,
      newSessionsByBucket,
      paths,
    ] = await Promise.all([
      collection.countDocuments(rangeMatch),
      collection.distinct('sessionId', rangeMatch),
      collection
        .aggregate([
          { $match: rangeMatch },
          {
            $group: {
              _id: { path: '$path', eventName: '$eventName' },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 30 },
        ])
        .toArray(),
      collection
        .aggregate([
          { $match: rangeMatch },
          {
            $group: {
              _id: dateTruncExpr('$timestamp', groupBy),
              count: { $sum: 1 },
            },
          },
          bucketDateProject,
          { $sort: { date: 1 } },
        ])
        .toArray(),
      collection
        .aggregate([
          { $match: rangeMatch },
          {
            $group: {
              _id: {
                bucket: dateTruncExpr('$timestamp', groupBy),
                sessionId: '$sessionId',
              },
            },
          },
          {
            $group: {
              _id: '$_id.bucket',
              count: { $sum: 1 },
            },
          },
          bucketDateProject,
          { $sort: { date: 1 } },
        ])
        .toArray(),
      collection
        .aggregate([
          ...(Object.keys(contentMatch).length > 0
            ? [{ $match: contentMatch }]
            : []),
          {
            $group: {
              _id: '$sessionId',
              firstTimestamp: { $min: '$timestamp' },
            },
          },
          ...(from
            ? [{ $match: { firstTimestamp: { $gte: from, $lte: now } } }]
            : []),
          {
            $group: {
              _id: dateTruncExpr('$firstTimestamp', groupBy),
              count: { $sum: 1 },
            },
          },
          bucketDateProject,
          { $sort: { date: 1 } },
        ])
        .toArray(),
      collection.distinct('path'),
    ]);

    const eventsMap = toCountMap(eventsByBucket);
    const uniqueMap = toCountMap(uniqueSessionsByBucket);
    const newMap = toCountMap(newSessionsByBucket);
    const allKeys = new Set([
      ...eventsMap.keys(),
      ...uniqueMap.keys(),
      ...newMap.keys(),
    ]);

    const series = Array.from(allKeys)
      .sort()
      .map((date) => ({
        date,
        events: eventsMap.get(date) || 0,
        uniqueSessions: uniqueMap.get(date) || 0,
        newSessions: newMap.get(date) || 0,
      }));

    const newSessions = series.reduce((sum, point) => sum + point.newSessions, 0);

    return NextResponse.json({
      range,
      groupBy,
      from: from?.toISOString() ?? null,
      to: now.toISOString(),
      totalEvents,
      uniqueSessions: uniqueSessionIds.length,
      newSessions,
      eventViews,
      series,
      paths: (paths.filter(Boolean) as string[]).sort(),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

const TZ = 'America/Argentina/Buenos_Aires';
const RANGES = ['7d', '30d', '90d', '1y', 'all'] as const;
const GROUPINGS = ['day', 'week', 'month'] as const;
const KINDS = ['all', 'pageview', 'event'] as const;

type Range = (typeof RANGES)[number];
type GroupBy = (typeof GROUPINGS)[number];
type Kind = (typeof KINDS)[number];

function parseRange(value: string | null): Range {
  return RANGES.includes(value as Range) ? (value as Range) : '90d';
}

function parseGroupBy(value: string | null, range: Range): GroupBy {
  if (GROUPINGS.includes(value as GroupBy)) return value as GroupBy;
  if (range === '7d' || range === '30d') return 'day';
  if (range === 'all') return 'month';
  return 'week';
}

function parseKind(value: string | null): Kind {
  return KINDS.includes(value as Kind) ? (value as Kind) : 'all';
}

function rangeStart(range: Range, now: Date): Date | null {
  if (range === 'all') return null;
  const days =
    range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function dateTruncExpr(field: string, unit: GroupBy) {
  const expr: Record<string, unknown> = {
    date: field,
    unit,
    timezone: TZ,
  };
  if (unit === 'week') expr.startOfWeek = 'monday';
  return { $dateTrunc: expr };
}

const bucketDateProject = {
  $project: {
    _id: 0,
    date: {
      $dateToString: {
        format: '%Y-%m-%d',
        date: '$_id',
        timezone: TZ,
      },
    },
    count: 1,
  },
};

function toCountMap(items: unknown[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const date =
      typeof rec.date === 'string'
        ? rec.date.slice(0, 10)
        : bucketToDateKey(rec._id);
    const count = typeof rec.count === 'number' ? rec.count : 0;
    if (date) map.set(date, count);
  }
  return map;
}

function bucketToDateKey(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return null;
}
