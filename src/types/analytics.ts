export interface AnalyticsEvent {
  sessionId: string;
  path: string;
  timestamp: Date;
  eventName?: string;
  userAgent?: string;
  referrer?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
}

